package com.example.tourism.community.dto;

public record FavoriteResponse(
        Long poiId,
        boolean isFavorite,
        String message
) {}

