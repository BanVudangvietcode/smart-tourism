package com.example.tourism.analytics.dto;

import java.time.LocalDateTime;

public record DwellEventResponse(
        Long id,
        String deviceId,
        Long userId,
        double latitude,
        double longitude,
        int dwellSeconds,
        Long matchedPoiId,
        String matchedPoiName,
        LocalDateTime recordedAt
) {
}

