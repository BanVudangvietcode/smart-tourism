package com.example.tourism.analytics.dto;

import java.util.List;
import java.util.Map;

public record HeatmapGeoJsonResponse(
        String type,
        List<HeatmapFeature> features
) {
    public static HeatmapGeoJsonResponse of(List<HeatmapFeature> features) {
        return new HeatmapGeoJsonResponse("FeatureCollection", features);
    }

    public record HeatmapFeature(
            String type,
            HeatmapGeometry geometry,
            Map<String, Object> properties
    ) {
        public static HeatmapFeature point(double lng, double lat, Map<String, Object> properties) {
            return new HeatmapFeature("Feature", new HeatmapGeometry("Point", new double[]{lng, lat}), properties);
        }
    }

    public record HeatmapGeometry(
            String type,
            double[] coordinates
    ) {
    }
}

