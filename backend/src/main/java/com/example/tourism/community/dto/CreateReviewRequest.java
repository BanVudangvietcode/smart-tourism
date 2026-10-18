package com.example.tourism.community.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateReviewRequest(
        @NotNull(message = "Điểm đánh giá (rating) từ 1 đến 5 sao là bắt buộc.")
        @Min(value = 1, message = "Điểm đánh giá tối thiểu là 1 sao.")
        @Max(value = 5, message = "Điểm đánh giá tối đa là 5 sao.")
        Integer rating,

        @NotBlank(message = "Nội dung đánh giá không được để trống.")
        String comment,

        List<String> images
) {}

