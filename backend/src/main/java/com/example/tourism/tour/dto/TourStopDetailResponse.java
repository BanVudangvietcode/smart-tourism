package com.example.tourism.tour.dto;

import com.example.tourism.poi.dto.PoiSummaryResponse;

/**
 * Detailed waypoint stop within a tour, including full POI summary data.
 */
public record TourStopDetailResponse(
        Long stopId,
        int stopOrder,
        int estimatedDurationMinutes,
        String recommendedDishOrActivity,
        String note,
        PoiSummaryResponse poi
) {}

