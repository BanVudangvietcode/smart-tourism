package com.example.tourism.community.dto;

import jakarta.validation.constraints.NotNull;

public record CheckinRequest(
        @NotNull(message = "Tọa độ vĩ độ (userLat) là bắt buộc.")
        Double userLat,

        @NotNull(message = "Tọa độ kinh độ (userLng) là bắt buộc.")
        Double userLng
) {}

