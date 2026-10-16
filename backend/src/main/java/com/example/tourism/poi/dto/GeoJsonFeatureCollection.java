package com.example.tourism.poi.dto;

import java.util.List;

/**
 * Represents a GeoJSON FeatureCollection.
 */
public record GeoJsonFeatureCollection(
        String type,
        List<GeoJsonFeature> features
) {
    public GeoJsonFeatureCollection(List<GeoJsonFeature> features) {
        this("FeatureCollection", features);
    }
}
