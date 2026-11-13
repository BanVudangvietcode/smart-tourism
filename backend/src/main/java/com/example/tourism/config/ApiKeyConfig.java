package com.example.tourism.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class holding external service API keys.
 * Values can be configured via environment variables (e.g. MAP_API_KEY)
 * or in application-local.properties.
 */
@Configuration
@ConfigurationProperties(prefix = "app.api")
public class ApiKeyConfig {

    private String mapKey = "";
    private String geminiKey = "";
    private String weatherKey = "";
    private String ttsKey = "";
    private String customKey = "";
    private String aiKey = "";
    private String aiModel = "gemini-2.5-flash";

    public String getAiKey() {
        return aiKey;
    }

    public void setAiKey(String aiKey) {
        this.aiKey = aiKey != null ? aiKey.trim() : "";
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = (aiModel != null && !aiModel.isBlank()) ? aiModel.trim() : "gemini-2.5-flash";
    }

    public String getEffectiveAiKey() {
        if (aiKey != null && !aiKey.isBlank()) return aiKey;
        if (geminiKey != null && !geminiKey.isBlank()) return geminiKey;
        if (customKey != null && !customKey.isBlank()) return customKey;
        return "";
    }

    public String getMapKey() {
        return mapKey;
    }

    public void setMapKey(String mapKey) {
        this.mapKey = mapKey != null ? mapKey.trim() : "";
    }

    public String getGeminiKey() {
        return geminiKey;
    }

    public void setGeminiKey(String geminiKey) {
        this.geminiKey = geminiKey != null ? geminiKey.trim() : "";
    }

    public String getWeatherKey() {
        return weatherKey;
    }

    public void setWeatherKey(String weatherKey) {
        this.weatherKey = weatherKey != null ? weatherKey.trim() : "";
    }

    public String getTtsKey() {
        return ttsKey;
    }

    public void setTtsKey(String ttsKey) {
        this.ttsKey = ttsKey != null ? ttsKey.trim() : "";
    }

    public String getCustomKey() {
        return customKey;
    }

    public void setCustomKey(String customKey) {
        this.customKey = customKey != null ? customKey.trim() : "";
    }
}

