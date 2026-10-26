package com.example.tourism.tour.dto;

import java.time.LocalDateTime;

public record TourReviewResponse(
        Long id,
        Long tourId,
        Long userId,
        String userDisplayName,
        String userAvatarUrl,
        Integer rating,
        String comment,
        Boolean isAnonymous,
        LocalDateTime createdAt
) {}

