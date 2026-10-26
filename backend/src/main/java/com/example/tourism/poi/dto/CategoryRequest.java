package com.example.tourism.poi.dto;

public record CategoryRequest(
        String name,
        String slug,
        String iconUrl,
        Integer sortOrder
) {}

