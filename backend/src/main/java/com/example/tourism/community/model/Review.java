package com.example.tourism.community.model;

import java.time.LocalDateTime;
import java.util.List;

public class Review {
    private Long id;
    private Long poiId;
    private Long userId;
    private Integer rating;
    private String comment;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Review() {}

    public Review(Long id, Long poiId, Long userId, Integer rating, String comment, List<String> images, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.poiId = poiId;
        this.userId = userId;
        this.rating = rating;
        this.comment = comment;
        this.images = images;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

