package com.example.tourism.poi.dto;

import java.util.Map;

/**
 * Represents a single GeoJSON Feature.
 */
public record GeoJsonFeature(
        String type,
        GeoJsonGeometry geometry,
        Map<String, Object> properties
) {
    public GeoJsonFeature(GeoJsonGeometry geometry, Map<String, Object> properties) {
        this("Feature", geometry, properties);
    }
}
