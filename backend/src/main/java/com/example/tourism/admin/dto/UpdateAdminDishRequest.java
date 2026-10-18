package com.example.tourism.admin.dto;

public record UpdateAdminDishRequest(
        String name,
        String categoryName,
        Integer price,
        Integer originalPrice,
        Boolean isSignature,
        Boolean isAvailable,
        String description,
        String allergens,
        String imageUrl,
        String unit
) {}

