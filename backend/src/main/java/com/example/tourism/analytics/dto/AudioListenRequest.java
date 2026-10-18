package com.example.tourism.analytics.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AudioListenRequest(
        @NotBlank(message = "deviceId không được để trống")
        String deviceId,

        @NotNull(message = "poiId không được để trống")
        Long poiId,

        @NotNull(message = "durationSeconds không được để trống")
        @Min(value = 0, message = "durationSeconds không được nhỏ hơn 0")
        Integer durationSeconds,

        @NotNull(message = "completed không được để trống")
        Boolean completed,

        @NotBlank(message = "triggerType không được để trống")
        @Pattern(regexp = "(?i)AUTO|MANUAL", message = "triggerType chỉ chấp nhận 'AUTO' hoặc 'MANUAL'")
        String triggerType
) {
    public String normalizedTriggerType() {
        return triggerType == null ? "MANUAL" : triggerType.toUpperCase();
    }
}

