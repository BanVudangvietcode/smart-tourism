package com.example.tourism.poi.dto;

public record PoiImageResponse(
        Long id,
        String url,
        String caption,
        int sortOrder
) {}
