package com.example.tourism.auth.dto;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String phone;
    private String displayName;
    private String role;

    // Full constructor
    public AuthResponse(String token, Long userId, String email, String displayName, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
    }

    // Legacy constructor for OTP-based auth
    public AuthResponse(String token, String phone) {
        this.token = token;
        this.phone = phone;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
