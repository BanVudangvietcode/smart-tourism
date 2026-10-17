package com.example.tourism.dish.dto;

import java.util.List;

/**
 * Summary view of a dish inside a menu category.
 */
public record DishSummaryResponse(
        Long id,
        Long poiId,
        Long menuCategoryId,
        String name,
        String slug,
        String description,
        int price,
        Integer originalPrice,
        String unit,
        boolean isSignature,
        String thumbnailUrl,
        List<String> allergens,
        boolean hasPeanuts,
        boolean hasSeafood,
        boolean hasGluten
) {}
