package com.example.tourism.tour.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request payload for creating a new tour (by Admin or User).
 * Supports choosing whether the tour is public or private.
 */
public record CreateTourRequest(
        @NotBlank(message = "Tên tour không được để trống.")
        String name,

        String description,
        String theme,
        Integer estimatedDurationMinutes,
        Integer estimatedCost,
        Integer totalDistanceMeters,
        String thumbnailUrl,
        Boolean isPublic,
        String creatorName,

        @NotEmpty(message = "Tour cần có ít nhất 1 điểm dừng (stops).")
        List<@Valid CreateTourStopRequest> stops
) {}

