package com.example.tourism.analytics.model;

import java.time.LocalDateTime;

public class AudioListenLog {
    private Long id;
    private String deviceId;
    private Long userId;
    private Long poiId;
    private int durationSeconds;
    private boolean completed;
    private String triggerType;
    private LocalDateTime createdAt;

    public AudioListenLog() {
    }

    public AudioListenLog(Long id, String deviceId, Long userId, Long poiId, int durationSeconds,
                          boolean completed, String triggerType, LocalDateTime createdAt) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.poiId = poiId;
        this.durationSeconds = durationSeconds;
        this.completed = completed;
        this.triggerType = triggerType;
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

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

