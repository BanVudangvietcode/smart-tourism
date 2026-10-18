package com.example.tourism.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * JSON request payload for sending voice recording as Base64.
 */
public record AiVoiceJsonRequest(
        @NotNull(message = "poiId không được để trống.")
        Long poiId,

        @NotBlank(message = "Dữ liệu âm thanh base64 không được để trống.")
        String base64Audio,

        String mimeType,
        Double userLat,
        Double userLng,
        String conversationId,
        Integer playbackSeconds,
        Boolean returnAudio
) {}

