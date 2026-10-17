package com.example.tourism.audio.model;

import java.time.LocalDateTime;

public class PoiAudio {
    private Long id;
    private Long poiId;
    private String poiName;
    private String title;
    private String fileName;
    private int durationSeconds;
    private long fileSizeBytes;
    private String voice;
    private String language;
    private String zone;
    private String transcript;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PoiAudio() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public String getPoiName() { return poiName; }
    public void setPoiName(String poiName) { this.poiName = poiName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

