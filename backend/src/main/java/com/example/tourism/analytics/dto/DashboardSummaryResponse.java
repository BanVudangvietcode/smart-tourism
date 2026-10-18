package com.example.tourism.analytics.dto;

import java.util.List;

public record DashboardSummaryResponse(
        AudioListenMetrics audioStats,
        DwellMetrics dwellStats,
        List<HotspotPoiSummary> topHotspots,
        SystemOverviewMetrics systemOverview
) {
    public record AudioListenMetrics(
            long totalListens,
            long completedListens,
            double completionRate,
            long totalListenMinutes,
            double avgListenSeconds,
            long autoTriggeredListens,
            long manualTriggeredListens
    ) {
    }

    public record DwellMetrics(
            long totalDwellEvents,
            double totalDwellMinutes,
            double avgDwellMinutes
    ) {
    }

    public record SystemOverviewMetrics(
            int totalTours,
            int avgTourDurationMinutes,
            int totalCheckins,
            int totalReviews,
            int totalFavorites
    ) {
    }
}

