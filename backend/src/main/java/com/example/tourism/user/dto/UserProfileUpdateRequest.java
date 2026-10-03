package com.example.tourism.user.dto;

/**
 * DTO for PUT /api/v1/users/me.
 * Allows updating display name, avatar, and food preferences.
 */
public class UserProfileUpdateRequest {
    private String displayName;
    private String avatarUrl;
    private Boolean spicy;
    private Boolean vegetarian;
    private Boolean noSeafood;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Boolean getSpicy() { return spicy; }
    public void setSpicy(Boolean spicy) { this.spicy = spicy; }

    public Boolean getVegetarian() { return vegetarian; }
    public void setVegetarian(Boolean vegetarian) { this.vegetarian = vegetarian; }

    public Boolean getNoSeafood() { return noSeafood; }
    public void setNoSeafood(Boolean noSeafood) { this.noSeafood = noSeafood; }
}
