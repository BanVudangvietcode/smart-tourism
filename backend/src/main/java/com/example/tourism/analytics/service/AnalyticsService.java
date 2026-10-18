package com.example.tourism.analytics.service;

import com.example.tourism.analytics.dto.*;
import com.example.tourism.analytics.model.AudioListenLog;
import com.example.tourism.analytics.model.DwellLog;
import com.example.tourism.analytics.repository.AudioListenRepository;
import com.example.tourism.analytics.repository.DwellRepository;
import com.example.tourism.common.exception.ResourceNotFoundException;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.repository.PoiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnalyticsService {

    private final AudioListenRepository audioListenRepository;
    private final DwellRepository dwellRepository;
    private final PoiRepository poiRepository;

    public AnalyticsService(AudioListenRepository audioListenRepository,
                            DwellRepository dwellRepository,
                            PoiRepository poiRepository) {
        this.audioListenRepository = audioListenRepository;
        this.dwellRepository = dwellRepository;
        this.poiRepository = poiRepository;
    }

    @Transactional
    public AudioListenResponse recordAudioListen(AudioListenRequest request, Long userId) {
        Poi poi = poiRepository.findById(request.poiId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa điểm với ID: " + request.poiId()));

        AudioListenLog log = new AudioListenLog();
        log.setDeviceId(request.deviceId().trim());
        log.setUserId(userId);
        log.setPoiId(request.poiId());
        log.setDurationSeconds(request.durationSeconds());
        log.setCompleted(request.completed());
        log.setTriggerType(request.normalizedTriggerType());

        return audioListenRepository.save(log, poi.getName());
    }

    @Transactional
    public DwellEventResponse recordDwellEvent(DwellEventRequest request, Long userId) {
        Optional<DwellRepository.PoiMatch> match = dwellRepository.findNearestPoi(
                request.lat(),
                request.lng(),
                50.0 // Bán kính 50m để liên kết điểm dừng với POI lân cận
        );

        DwellLog log = new DwellLog();
        log.setDeviceId(request.deviceId().trim());
        log.setUserId(userId);
        log.setLatitude(request.lat());
        log.setLongitude(request.lng());
        log.setDwellSeconds(request.dwellSeconds());
        log.setMatchedPoiId(match.map(DwellRepository.PoiMatch::id).orElse(null));

        String matchedPoiName = match.map(DwellRepository.PoiMatch::name).orElse(null);
        return dwellRepository.save(log, matchedPoiName);
    }

    @Transactional(readOnly = true)
    public HeatmapGeoJsonResponse getHeatmap(int minDwellSeconds, int limit) {
        int safeMinSeconds = Math.max(0, minDwellSeconds);
        int safeLimit = Math.min(1000, Math.max(1, limit));
        return dwellRepository.findHeatmapFeatures(safeMinSeconds, safeLimit);
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        // 1. Audio metrics
        long totalListens = audioListenRepository.countTotalListens();
        long completedListens = audioListenRepository.countCompletedListens();
        double completionRate = totalListens > 0
                ? Math.round((completedListens * 1000.0) / totalListens) / 10.0
                : 0.0;
        long totalListenSeconds = audioListenRepository.sumListenSeconds();
        long totalListenMinutes = Math.round(totalListenSeconds / 60.0);
        double avgListenSeconds = audioListenRepository.avgListenSeconds();
        long autoTriggered = audioListenRepository.countByTriggerType("AUTO");
        long manualTriggered = audioListenRepository.countByTriggerType("MANUAL");

        DashboardSummaryResponse.AudioListenMetrics audioStats = new DashboardSummaryResponse.AudioListenMetrics(
                totalListens,
                completedListens,
                completionRate,
                totalListenMinutes,
                avgListenSeconds,
                autoTriggered,
                manualTriggered
        );

        // 2. Dwell metrics
        long totalDwellEvents = dwellRepository.countTotalDwellEvents();
        double totalDwellMinutes = dwellRepository.sumDwellMinutes();
        double avgDwellMinutes = dwellRepository.avgDwellMinutes();

        DashboardSummaryResponse.DwellMetrics dwellStats = new DashboardSummaryResponse.DwellMetrics(
                totalDwellEvents,
                totalDwellMinutes,
                avgDwellMinutes
        );

        // 3. Top hotspots
        List<HotspotPoiSummary> topHotspots = dwellRepository.findTopHotspots(5);

        // 4. System overview
        int totalTours = dwellRepository.countTotalTours();
        int avgTourDurationMinutes = dwellRepository.avgTourDurationMinutes();
        int totalCheckins = dwellRepository.countTotalCheckins();
        int totalReviews = dwellRepository.countTotalReviews();
        int totalFavorites = dwellRepository.countTotalFavorites();

        DashboardSummaryResponse.SystemOverviewMetrics systemOverview = new DashboardSummaryResponse.SystemOverviewMetrics(
                totalTours,
                avgTourDurationMinutes,
                totalCheckins,
                totalReviews,
                totalFavorites
        );

        return new DashboardSummaryResponse(audioStats, dwellStats, topHotspots, systemOverview);
    }
}

