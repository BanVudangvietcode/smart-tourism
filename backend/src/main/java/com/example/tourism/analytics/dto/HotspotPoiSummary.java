package com.example.tourism.analytics.dto;

public record HotspotPoiSummary(
        Long poiId,
        String poiName,
        String categoryName,
        int listenCount,
        int checkinCount,
        double totalDwellMinutes,
        double avgRating
) {
}

