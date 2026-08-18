package com.rental.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.rental.exception.ApiException;
import com.rental.model.AuthProvider;
import com.rental.model.Role;
import com.rental.model.User;
import com.rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Verifies Google ID tokens and maps them onto local accounts.
 *
 * Flow:
 *   browser -> Google Identity Services -> ID token (JWT)
 *   browser -> POST /api/auth/google { credential }
 *   here    -> verify signature/issuer/audience/expiry against Google's public keys
 *           -> find or create the local user
 *   caller  -> issues our own app JWT, exactly like password login does
 *
 * Verification is offline (Google's signing keys are fetched and cached by the
 * verifier), so there is no per-login round trip to Google.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.oauth.google.client-id:}")
    private String clientId;

    /** Built lazily so the app still starts when no client id is configured. */
    private volatile GoogleIdTokenVerifier verifier;

    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank();
    }

    public String getClientId() {
        return clientId == null ? "" : clientId.trim();
    }

    private GoogleIdTokenVerifier verifier() {
        GoogleIdTokenVerifier local = verifier;
        if (local == null) {
            synchronized (this) {
                local = verifier;
                if (local == null) {
                    local = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                            .setAudience(Collections.singletonList(getClientId()))
                            .build();
                    verifier = local;
                }
            }
        }
        return local;
    }

    /**
     * Verifies the credential and returns the matching local user, creating or
     * linking one as needed.
     */
    @Transactional
    public User loginOrRegister(String credential) {
        if (!isEnabled()) {
            throw new ApiException("Google sign-in is not configured on this server.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        GoogleIdToken idToken;
        try {
            // Checks signature, issuer, audience (our client id) and expiry.
            idToken = verifier().verify(credential);
        } catch (Exception e) {
            log.warn("Google ID token verification error: {}", e.toString());
            throw new ApiException("Could not verify Google sign-in. Please try again.", HttpStatus.UNAUTHORIZED);
        }
        if (idToken == null) {
            throw new ApiException("Invalid or expired Google sign-in token.", HttpStatus.UNAUTHORIZED);
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        Boolean emailVerified = payload.getEmailVerified();
        String fullName = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            throw new ApiException("Your Google account did not share an email address.", HttpStatus.BAD_REQUEST);
        }
        // Without this check, someone could claim an unverified address that
        // belongs to an existing local account.
        if (!Boolean.TRUE.equals(emailVerified)) {
            throw new ApiException("Your Google email address is not verified.", HttpStatus.FORBIDDEN);
        }

        email = email.toLowerCase();

        // 1. Already signed in with this Google account before.
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            assertEnabled(user);
            boolean dirty = false;
            if (picture != null && !picture.equals(user.getPictureUrl())) {
                user.setPictureUrl(picture);
                dirty = true;
            }
            if ((user.getFullName() == null || user.getFullName().isBlank()) && fullName != null) {
                user.setFullName(fullName);
                dirty = true;
            }
            return dirty ? userRepository.save(user) : user;
        }

        // 2. An existing account already owns this (Google-verified) email —
        //    link the two so the user keeps their bookings and role.
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            assertEnabled(user);
            user.setGoogleId(googleId);
            if (picture != null) user.setPictureUrl(picture);
            if (user.getFullName() == null || user.getFullName().isBlank()) user.setFullName(fullName);
            // provider stays as-is: a local account keeps its password login.
            log.info("Linked Google account to existing user '{}'", user.getUsername());
            return userRepository.save(user);
        }

        // 3. Brand new user.
        User user = User.builder()
                .username(uniqueUsernameFor(email))
                // Google accounts never log in with a password, but the column is
                // NOT NULL, so store an unguessable random hash rather than a blank.
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .email(email)
                .fullName(fullName)
                .role(Role.CUSTOMER)
                .provider(AuthProvider.GOOGLE)
                .googleId(googleId)
                .pictureUrl(picture)
                .enabled(true)
                .build();
        log.info("Created new user '{}' via Google sign-in", user.getUsername());
        return userRepository.save(user);
    }

    private void assertEnabled(User user) {
        if (!user.isEnabled()) {
            throw new ApiException("This account has been disabled.", HttpStatus.FORBIDDEN);
        }
    }

    /** Derives a username from the email local part, adding a suffix on collision. */
    private String uniqueUsernameFor(String email) {
        String base = email.substring(0, email.indexOf('@'))
                .toLowerCase()
                .replaceAll("[^a-z0-9._-]", "");
        if (base.isBlank()) base = "user";
        if (base.length() > 20) base = base.substring(0, 20);

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}
