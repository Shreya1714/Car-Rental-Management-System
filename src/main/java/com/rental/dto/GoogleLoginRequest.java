package com.rental.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Body of POST /api/auth/google.
 * "credential" is the ID token (a JWT) handed to the browser by Google Identity
 * Services. It is verified server-side before we trust anything inside it.
 */
@Data
public class GoogleLoginRequest {
    @NotBlank
    private String credential;
}
