package com.example.tourism.community.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CheckinResponse(
        boolean success,
        Long poiId,
        String poiName,
        double distanceMeters,
        boolean verified,
        String message,
        LocalDateTime checkinTime,
        List<BadgeResponse> newlyUnlockedBadges
) {}

