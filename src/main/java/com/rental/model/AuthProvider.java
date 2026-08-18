package com.rental.model;

/**
 * How an account was originally created.
 *
 * LOCAL  -> username + password (has a real BCrypt hash, can change password)
 * GOOGLE -> created via Google Sign-In (password is a random unusable value)
 *
 * Note: existing rows created before this column was introduced will have
 * provider == null. Treat null as LOCAL everywhere.
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
