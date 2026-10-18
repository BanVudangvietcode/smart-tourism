package com.example.tourism.tour.dto;

import java.util.List;

/**
 * Result of the AI/Greedy custom tour itinerary planning.
 */
public record CustomPlanResponse(
        int availableMinutes,
        int totalDurationMinutes,
        int remainingMinutes,
        int estimatedCost,
        int totalDistanceMeters,
        int stopCount,
        List<CustomPlanStopResponse> stops,
        Long savedTourId
) {}

