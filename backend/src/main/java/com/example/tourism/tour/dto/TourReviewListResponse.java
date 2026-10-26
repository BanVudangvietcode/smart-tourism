package com.example.tourism.tour.dto;

import java.util.List;

public record TourReviewListResponse(
        List<TourReviewResponse> items,
        long totalCount,
        Double avgRating
) {}

