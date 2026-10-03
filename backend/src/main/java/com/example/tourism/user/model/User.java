package com.example.tourism.user.model;

import java.time.LocalDateTime;

/**
 * Represents a user in the system. Supports local (email/password),
 * Google OAuth2, and guest (anonymous device) accounts.
 */
public class User {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String provider;      // "local", "google", "guest"
    private String providerId;    // Google sub or device ID
    private boolean spicy;
    private boolean vegetarian;
    private boolean noSeafood;
    private String role;          // "USER", "ADMIN", "GUEST"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }



    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public boolean isSpicy() { return spicy; }
    public void setSpicy(boolean spicy) { this.spicy = spicy; }

    public boolean isVegetarian() { return vegetarian; }
    public void setVegetarian(boolean vegetarian) { this.vegetarian = vegetarian; }

    public boolean isNoSeafood() { return noSeafood; }
    public void setNoSeafood(boolean noSeafood) { this.noSeafood = noSeafood; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
