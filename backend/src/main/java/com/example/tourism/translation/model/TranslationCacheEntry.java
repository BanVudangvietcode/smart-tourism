package com.example.tourism.translation.model;

import java.time.LocalDateTime;

public class TranslationCacheEntry {
    private String hashKey;
    private String locale;
    private String translatedText;
    private LocalDateTime createdAt;

    public TranslationCacheEntry() {
    }

    public TranslationCacheEntry(String hashKey, String locale, String translatedText) {
        this.hashKey = hashKey;
        this.locale = locale;
        this.translatedText = translatedText;
        this.createdAt = LocalDateTime.now();
    }

    public String getHashKey() {
        return hashKey;
    }

    public void setHashKey(String hashKey) {
        this.hashKey = hashKey;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
