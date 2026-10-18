package com.example.tourism.analytics.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DwellEventRequest(
        @NotBlank(message = "deviceId không được để trống")
        String deviceId,

        @NotNull(message = "lat không được để trống")
        @Min(value = -90, message = "lat phải từ -90 đến 90")
        @Max(value = 90, message = "lat phải từ -90 đến 90")
        Double lat,

        @NotNull(message = "lng không được để trống")
        @Min(value = -180, message = "lng phải từ -180 đến 180")
        @Max(value = 180, message = "lng phải từ -180 đến 180")
        Double lng,

        @NotNull(message = "dwellSeconds không được để trống")
        @Min(value = 1, message = "dwellSeconds phải lớn hơn 0")
        Integer dwellSeconds
) {
}

