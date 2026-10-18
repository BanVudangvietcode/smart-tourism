package com.example.tourism.audio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Yêu cầu sinh âm thanh tự động từ văn bản kịch bản (Text-To-Speech).
 */
public class AudioTextGenerateRequest {

    @NotNull(message = "POI ID là bắt buộc.")
    private Long poiId;

    private String title;

    @NotBlank(message = "Nội dung thuyết minh (transcript) không được để trống.")
    private String transcript;
    private String voice = "Nữ miền Nam (Truyền cảm)";
    private String zone = "quan4";

    public AudioTextGenerateRequest() {}

    public AudioTextGenerateRequest(Long poiId, String title, String transcript, String voice, String zone) {
        this.poiId = poiId;
        this.title = title;
        this.transcript = transcript;
        if (voice != null && !voice.isBlank()) this.voice = voice;
        if (zone != null && !zone.isBlank()) this.zone = zone;
    }

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getVoice() {
        return voice;
    }

    public void setVoice(String voice) {
        this.voice = voice;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }
}

