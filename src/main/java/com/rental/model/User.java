package com.rental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String password; // BCrypt hashed — never serialized to JSON

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Which identity provider created this account. Nullable on purpose so that
     * ddl-auto=update can add the column to a database that already has rows —
     * null is treated as LOCAL.
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    /** Google's stable user id ("sub" claim). Null for accounts never linked to Google. */
    @JsonIgnore
    @Column(unique = true)
    private String googleId;

    /** Google profile picture, used for the avatar when available. */
    @Column(length = 512)
    private String pictureUrl;

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** True when the account has a real password the user can log in with / change. */
    @JsonIgnore
    public boolean isPasswordAccount() {
        return provider == null || provider == AuthProvider.LOCAL;
    }
}
