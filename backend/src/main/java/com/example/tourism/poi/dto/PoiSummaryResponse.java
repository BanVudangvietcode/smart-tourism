package com.example.tourism.poi.dto;

import java.math.BigDecimal;

/**
 * Lightweight POI representation used in list, viewport, and nearby results.
 */
public record PoiSummaryResponse(
        Long id,
        String name,
        String slug,
        String address,
        String thumbnailUrl,
        BigDecimal avgRating,
        int reviewCount,
        Integer priceRangeMin,
        Integer priceRangeMax,
        String categoryName,
        String poiType,
        double longitude,
        double latitude,
        Double distanceMeters
) {}
