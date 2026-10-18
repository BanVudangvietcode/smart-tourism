package com.example.tourism.admin.dto;

public record UpdateAdminPoiRequest(
        String name,
        String description,
        String address,
        String district,
        String ward,
        String phone,
        String openingHours,
        Integer priceRangeMin,
        Integer priceRangeMax,
        Long categoryId,
        String poiType,
        Double latitude,
        Double longitude,
        String thumbnailUrl,
        Boolean isActive
) {}

