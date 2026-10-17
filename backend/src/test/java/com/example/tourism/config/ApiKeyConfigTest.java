package com.example.tourism.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ApiKeyConfig Tests")
class ApiKeyConfigTest {

    @Test
    @DisplayName("Should correctly store and retrieve trimmed API keys")
    void testSettersAndGetters() {
        ApiKeyConfig config = new ApiKeyConfig();
        config.setMapKey("  map-key-123  ");
        config.setGeminiKey("gemini-key-456");
        config.setWeatherKey("weather-key-789");
        config.setTtsKey("tts-key-012");
        config.setCustomKey("custom-key-345");

        assertEquals("map-key-123", config.getMapKey());
        assertEquals("gemini-key-456", config.getGeminiKey());
        assertEquals("weather-key-789", config.getWeatherKey());
        assertEquals("tts-key-012", config.getTtsKey());
        assertEquals("custom-key-345", config.getCustomKey());
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void testNullHandling() {
        ApiKeyConfig config = new ApiKeyConfig();
        config.setMapKey(null);
        config.setGeminiKey(null);

        assertEquals("", config.getMapKey());
        assertEquals("", config.getGeminiKey());
    }
}

