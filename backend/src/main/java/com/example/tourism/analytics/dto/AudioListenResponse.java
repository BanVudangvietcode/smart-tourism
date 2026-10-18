package com.example.tourism.analytics.dto;

import java.time.LocalDateTime;

public record AudioListenResponse(
        Long id,
        String deviceId,
        Long userId,
        Long poiId,
        String poiName,
        int durationSeconds,
        boolean completed,
        String triggerType,
        LocalDateTime recordedAt
) {
}

