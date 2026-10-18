package com.example.tourism.tour.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Complete tour itinerary details, containing all sequential stops and waypoints.
 */
public record TourDetailResponse(
        Long id,
        String name,
        String slug,
        String description,
        String theme,
        int estimatedDurationMinutes,
        int estimatedCost,
        int totalDistanceMeters,
        String thumbnailUrl,
        boolean isPublic,
        Long creatorId,
        String creatorRole,
        String creatorName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TourStopDetailResponse> stops
) {}

