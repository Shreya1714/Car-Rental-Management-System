package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Public auth configuration for the browser. Lets the frontend show or hide the
 * Google button without hard-coding the client id in JavaScript.
 * The OAuth *client id* is public information; the client secret is never used
 * by this flow and is never sent anywhere.
 */
@Data
@AllArgsConstructor
public class AuthConfigResponse {
    private boolean googleEnabled;
    private String googleClientId;
}
