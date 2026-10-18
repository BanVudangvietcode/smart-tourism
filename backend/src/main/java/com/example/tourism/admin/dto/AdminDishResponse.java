package com.example.tourism.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminDishResponse(
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
        boolean isAvailable,
        String thumbnailUrl,
        List<String> ingredients,
        List<String> allergens,
        boolean hasPeanuts,
        boolean hasSeafood,
        boolean hasGluten,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

