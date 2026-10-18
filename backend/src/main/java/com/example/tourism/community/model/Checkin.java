package com.example.tourism.community.model;

import java.time.LocalDateTime;

public class Checkin {
    private Long id;
    private Long userId;
    private Long poiId;
    private Double checkinLat;
    private Double checkinLng;
    private Double distanceMeters;
    private Boolean verified;
    private LocalDateTime createdAt;

    public Checkin() {}

    public Checkin(Long id, Long userId, Long poiId, Double checkinLat, Double checkinLng, Double distanceMeters, Boolean verified, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.poiId = poiId;
        this.checkinLat = checkinLat;
        this.checkinLng = checkinLng;
        this.distanceMeters = distanceMeters;
        this.verified = verified;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public Double getCheckinLat() { return checkinLat; }
    public void setCheckinLat(Double checkinLat) { this.checkinLat = checkinLat; }

    public Double getCheckinLng() { return checkinLng; }
    public void setCheckinLng(Double checkinLng) { this.checkinLng = checkinLng; }

    public Double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }

    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

