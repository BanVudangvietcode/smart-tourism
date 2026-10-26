package com.example.tourism.tour.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTourReviewRequest(
        @NotNull(message = "Điểm đánh giá từ 1 đến 5 sao")
        @Min(value = 1, message = "Điểm đánh giá tối thiểu là 1 sao")
        @Max(value = 5, message = "Điểm đánh giá tối đa là 5 sao")
        Integer rating,

        @NotBlank(message = "Nội dung nhận xét không được để trống")
        String comment,

        Boolean isAnonymous
) {}
