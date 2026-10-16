package com.example.tourism.poi.dto;

/**
 * Represents a GeoJSON Point geometry.
 */
public record GeoJsonGeometry(
        String type,
        double[] coordinates
) {
    public static GeoJsonGeometry point(double longitude, double latitude) {
        return new GeoJsonGeometry("Point", new double[]{longitude, latitude});
    }
}
