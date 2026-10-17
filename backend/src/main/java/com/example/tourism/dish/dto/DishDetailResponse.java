package com.example.tourism.dish.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed dish information including description, close-up images,
 * primary ingredients, and allergen warnings (peanuts, seafood, gluten).
 */
public record DishDetailResponse(
        Long id,
        Long poiId,
        String poiName,
        Long menuCategoryId,
        String menuCategoryName,
        String name,
        String slug,
        String description,
        int price,
        Integer originalPrice,
        String unit,
        boolean isSignature,
        String thumbnailUrl,
        List<String> ingredients,
        List<String> allergens,
        boolean hasPeanuts,
        boolean hasSeafood,
        boolean hasGluten,
        List<DishImageResponse> images,
        LocalDateTime createdAt
) {}
