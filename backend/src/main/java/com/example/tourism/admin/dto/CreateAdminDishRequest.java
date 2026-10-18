package com.example.tourism.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAdminDishRequest(
        @NotBlank(message = "Tên món ăn không được để trống")
        String name,
        String categoryName,
        @NotNull(message = "Giá tiền không được để trống")
        @Min(value = 0, message = "Giá tiền phải từ 0 trở lên")
        Integer price,
        Integer originalPrice,
        Boolean isSignature,
        String description,
        String allergens,
        String imageUrl,
        String unit
) {}

