package com.example.tourism.tour.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for a single stop when creating a new tour.
 */
public record CreateTourStopRequest(
        @NotNull(message = "POI ID (poiId) là bắt buộc.")
        Long poiId,

        @NotNull(message = "Thứ tự điểm dừng (stopOrder) là bắt buộc.")
        @Min(value = 1, message = "Thứ tự điểm dừng (stopOrder) phải lớn hơn hoặc bằng 1.")
        Integer stopOrder,

        Integer estimatedDurationMinutes,
        String recommendedDishOrActivity,
        String note
) {}

