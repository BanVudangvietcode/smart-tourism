package com.example.tourism.audio.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Kết quả trả về sau khi sinh bộ audio đa ngôn ngữ.
 */
public class MultilingualAudioResponse {

    private Long poiId;
    private String poiName;
    private AudioCreateResponse originalAudio;
    private List<AudioCreateResponse> translatedAudios = new ArrayList<>();
    private int totalLanguages;
    private String message;

    public MultilingualAudioResponse() {}

    public MultilingualAudioResponse(Long poiId, String poiName, AudioCreateResponse originalAudio,
                                    List<AudioCreateResponse> translatedAudios, int totalLanguages, String message) {
        this.poiId = poiId;
        this.poiName = poiName;
        this.originalAudio = originalAudio;
        this.translatedAudios = translatedAudios != null ? translatedAudios : new ArrayList<>();
        this.totalLanguages = totalLanguages;
        this.message = message;
    }

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public String getPoiName() {
        return poiName;
    }

    public void setPoiName(String poiName) {
        this.poiName = poiName;
    }

    public AudioCreateResponse getOriginalAudio() {
        return originalAudio;
    }

    public void setOriginalAudio(AudioCreateResponse originalAudio) {
        this.originalAudio = originalAudio;
    }

    public List<AudioCreateResponse> getTranslatedAudios() {
        return translatedAudios;
    }

    public void setTranslatedAudios(List<AudioCreateResponse> translatedAudios) {
        this.translatedAudios = translatedAudios;
    }

    public int getTotalLanguages() {
        return totalLanguages;
    }

    public void setTotalLanguages(int totalLanguages) {
        this.totalLanguages = totalLanguages;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
