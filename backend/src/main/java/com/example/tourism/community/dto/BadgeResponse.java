package com.example.tourism.community.dto;

import java.time.LocalDateTime;

public record BadgeResponse(
        String badgeCode,
        String badgeName,
        String description,
        String iconUrl,
        LocalDateTime unlockedAt
) {}

