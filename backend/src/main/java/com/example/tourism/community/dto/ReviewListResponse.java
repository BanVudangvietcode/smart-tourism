package com.example.tourism.community.dto;

import java.util.List;

public record ReviewListResponse(
        List<ReviewResponse> items,
        long totalCount,
        int page,
        int size,
        int totalPages,
        Double avgRating,
        Integer reviewCount
) {}

