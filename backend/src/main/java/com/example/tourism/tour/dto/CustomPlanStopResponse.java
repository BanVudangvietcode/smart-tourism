package com.example.tourism.tour.dto;

import com.example.tourism.poi.dto.PoiSummaryResponse;

/**
 * Stop information in an automated custom tour plan.
 */
public record CustomPlanStopResponse(
        int stopOrder,
        PoiSummaryResponse poi,
        int estimatedDurationMinutes,
        int travelMinutesFromPrevious,
        double distanceMetersFromPrevious,
        String recommendedDishOrActivity,
        String note
) {}

