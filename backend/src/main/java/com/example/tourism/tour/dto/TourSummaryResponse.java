package com.example.tourism.tour.dto;

import java.time.LocalDateTime;

/**
 * Summary representation of a tour in list queries.
 */
public record TourSummaryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String theme,
        int estimatedDurationMinutes,
        int estimatedCost,
        int totalDistanceMeters,
        String thumbnailUrl,
        int stopCount,
        boolean isPublic,
        Long creatorId,
        String creatorRole,
        String creatorName,
        LocalDateTime createdAt
) {}

