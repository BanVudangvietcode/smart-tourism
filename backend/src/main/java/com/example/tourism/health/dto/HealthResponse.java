package com.example.tourism.health.dto;

import java.time.Instant;

public record HealthResponse(
        String status,
        String database,
        Instant timestamp
) {
}
