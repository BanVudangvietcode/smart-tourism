package com.example.tourism.auth.model;

/**
 * Model đại diện cho thông tin người dùng được xác thực từ JWT token.
 * Được tự động tiêm (inject) vào Controller endpoints thông qua CurrentUserArgumentResolver.
 */
public record AuthUser(
        Long id,
        String role
) {
    public boolean isAuthenticated() {
        return id != null;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }

    public boolean isGuest() {
        return "GUEST".equalsIgnoreCase(role);
    }
}

