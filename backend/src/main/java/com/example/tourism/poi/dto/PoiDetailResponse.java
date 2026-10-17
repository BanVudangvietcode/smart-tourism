package com.example.tourism.poi.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full POI detail response, including images and audio.
 */
public record PoiDetailResponse(
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
        String categoryName,
        String poiType,
        double longitude,
        double latitude,
        List<PoiImageResponse> images
) {}
