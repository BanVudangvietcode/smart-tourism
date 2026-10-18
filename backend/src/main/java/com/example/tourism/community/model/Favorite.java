package com.example.tourism.community.model;

import java.time.LocalDateTime;

public class Favorite {
    private Long id;
    private Long userId;
    private Long poiId;
    private LocalDateTime createdAt;

    public Favorite() {}

    public Favorite(Long id, Long userId, Long poiId, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.poiId = poiId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

