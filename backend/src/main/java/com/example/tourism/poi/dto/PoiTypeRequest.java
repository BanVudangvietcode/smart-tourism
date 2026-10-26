package com.example.tourism.poi.dto;

public record PoiTypeRequest(
        String code,
        String name,
        String icon,
        String description,
        Integer sortOrder
) {}
