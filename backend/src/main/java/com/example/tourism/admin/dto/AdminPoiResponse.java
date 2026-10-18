package com.example.tourism.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminPoiResponse(
        Long id,
        String name,
        String slug,
        String description,
        String address,
        String district,
        String ward,
        String phone,
        String openingHours,
        Integer priceRangeMin,
        Integer priceRangeMax,
        BigDecimal avgRating,
        int reviewCount,
        int popularity,
        String audioUrl,
        String thumbnailUrl,
        Long categoryId,
        String categoryName,
        String poiType,
        double latitude,
        double longitude,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

