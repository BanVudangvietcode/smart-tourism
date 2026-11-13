package com.example.tourism.tour.model;

import java.time.LocalDateTime;

/**
 * Entity representing a curated or custom tour.
 * Supports public curated tours by admins/system,
 * as well as custom private or public tours created by users.
 */
public class Tour {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String theme; // "FOOD", "CULTURE", "RELIGIOUS", "LANDMARK", "MIXED"
    private int estimatedDurationMinutes;
    private int estimatedCost;
    private int totalDistanceMeters;
    private String thumbnailUrl;
    private boolean isPublic;
    private Long creatorId;
    private String creatorRole; // "ADMIN", "USER"
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Tour() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(int estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }

    public int getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(int estimatedCost) { this.estimatedCost = estimatedCost; }

    public int getTotalDistanceMeters() { return totalDistanceMeters; }
    public void setTotalDistanceMeters(int totalDistanceMeters) { this.totalDistanceMeters = totalDistanceMeters; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }

    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }

    public String getCreatorRole() { return creatorRole; }
    public void setCreatorRole(String creatorRole) { this.creatorRole = creatorRole; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

