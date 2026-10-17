package com.example.tourism.dish.dto;

public record DishImageResponse(
        Long id,
        String url,
        String caption,
        boolean isCloseUp,
        int sortOrder
) {}
