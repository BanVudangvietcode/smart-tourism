package com.example.tourism.poi.dto;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String iconUrl,
        int sortOrder
) {}
