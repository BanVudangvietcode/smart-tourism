package com.example.tourism.analytics.model;

import java.time.LocalDateTime;

public class DwellLog {
    private Long id;
    private String deviceId;
    private Long userId;
    private double latitude;
    private double longitude;
    private int dwellSeconds;
    private Long matchedPoiId;
    private LocalDateTime createdAt;

    public DwellLog() {
    }

    public DwellLog(Long id, String deviceId, Long userId, double latitude, double longitude,
                    int dwellSeconds, Long matchedPoiId, LocalDateTime createdAt) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.dwellSeconds = dwellSeconds;
        this.matchedPoiId = matchedPoiId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public int getDwellSeconds() {
        return dwellSeconds;
    }

    public void setDwellSeconds(int dwellSeconds) {
        this.dwellSeconds = dwellSeconds;
    }

    public Long getMatchedPoiId() {
        return matchedPoiId;
    }

    public void setMatchedPoiId(Long matchedPoiId) {
        this.matchedPoiId = matchedPoiId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

