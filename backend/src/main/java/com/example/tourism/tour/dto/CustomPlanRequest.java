package com.example.tourism.tour.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request payload for auto-generating a customized tour based on available free time.
 */
public record CustomPlanRequest(
        @NotNull(message = "Quỹ thời gian (availableMinutes) tối thiểu là 15 phút.")
        @Min(value = 15, message = "Quỹ thời gian (availableMinutes) tối thiểu là 15 phút.")
        Integer availableMinutes,

        @NotNull(message = "Tọa độ xuất phát (startLat, startLng) là bắt buộc.")
        Double startLat,

        @NotNull(message = "Tọa độ xuất phát (startLat, startLng) là bắt buộc.")
        Double startLng,

        List<Long> selectedCategories,
        List<String> poiTypes,
        Integer maxBudget,
        Boolean saveAsTour,
        String tourName,
        Boolean isPublic
) {}

