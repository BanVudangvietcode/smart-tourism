package com.example.tourism.user.dto;

import com.example.tourism.user.model.User;

import java.time.LocalDateTime;

/**
 * DTO returned by GET /api/v1/users/me.
 * Excludes sensitive fields like passwordHash.
 */
public class UserProfileResponse {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String provider;
    private boolean spicy;
    private boolean vegetarian;
    private boolean noSeafood;
    private String role;
    private LocalDateTime createdAt;

    public static UserProfileResponse fromUser(User user) {
        UserProfileResponse dto = new UserProfileResponse();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.displayName = user.getDisplayName();
        dto.avatarUrl = user.getAvatarUrl();
        dto.provider = user.getProvider();
        dto.spicy = user.isSpicy();
        dto.vegetarian = user.isVegetarian();
        dto.noSeafood = user.isNoSeafood();
        dto.role = user.getRole();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getProvider() { return provider; }
    public boolean isSpicy() { return spicy; }
    public boolean isVegetarian() { return vegetarian; }
    public boolean isNoSeafood() { return noSeafood; }
    public String getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
