package com.example.tourism.admin.dto;

public record DetectedDishDraft(
        String name,
        String categoryName,
        int price,
        boolean isSignature,
        String description,
        String allergens
) {}

