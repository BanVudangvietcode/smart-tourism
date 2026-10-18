package com.example.tourism.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAdminPoiRequest(
        @NotBlank(message = "Tên địa điểm không được để trống")
        String name,
        String slug,
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
        @NotNull(message = "Vĩ độ (latitude) không được để trống")
        Double latitude,
        @NotNull(message = "Kinh độ (longitude) không được để trống")
        Double longitude,
        String thumbnailUrl
) {}

