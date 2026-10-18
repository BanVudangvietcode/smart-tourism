package com.example.tourism.community.dto;

import java.time.LocalDateTime;

public record UserFavoritePoiResponse(
        Long poiId,
        String name,
        String slug,
        String poiType,
        String categoryName,
        String address,
        String thumbnailUrl,
        Double avgRating,
        Integer reviewCount,
        Double latitude,
        Double longitude,
        LocalDateTime favoritedAt
) {}

