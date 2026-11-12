package com.example.tourism.audio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

/**
 * Yêu cầu sinh âm thanh đa ngôn ngữ tự động:
 * Nhập văn bản kịch bản gốc (tiếng Việt), hệ thống tự dịch và sinh giọng nói cho các ngôn ngữ phổ biến.
 */
public class MultilingualAudioRequest {

    @NotNull(message = "POI ID là bắt buộc.")
    private Long poiId;

    private String title;

    @NotBlank(message = "Nội dung thuyết minh (transcript) gốc không được để trống.")
    private String transcript;

    private String voice = "Nữ miền Nam (Truyền cảm)";
    private String zone = "quan4";

    /**
     * Danh sách các ngôn ngữ đích cần dịch sang.
     * Mặc định nếu null hoặc rỗng: ["en", "zh", "ja", "ko", "fr"]
     */
    private List<String> targetLanguages = new ArrayList<>(List.of("en", "zh", "ja", "ko", "fr"));

    public MultilingualAudioRequest() {}

    public MultilingualAudioRequest(Long poiId, String title, String transcript, String voice, String zone, List<String> targetLanguages) {
        this.poiId = poiId;
        this.title = title;
        this.transcript = transcript;
        if (voice != null && !voice.isBlank()) this.voice = voice;
        if (zone != null && !zone.isBlank()) this.zone = zone;
        if (targetLanguages != null && !targetLanguages.isEmpty()) {
            this.targetLanguages = targetLanguages;
        }
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

    public List<String> getTargetLanguages() {
        return targetLanguages;
    }

    public void setTargetLanguages(List<String> targetLanguages) {
        this.targetLanguages = targetLanguages;
    }
}
