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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;

@Service
public class AnalyticsService {

    private final AudioListenRepository audioListenRepository;
    private final DwellRepository dwellRepository;
    private final PoiRepository poiRepository;

    // Real-time visitor tracking & SSE broadcasting
    private final CopyOnWriteArrayList<SseEmitter> visitorEmitters = new CopyOnWriteArrayList<>();
    private final ConcurrentHashMap<String, Long> activeVisitorsMap = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "visitor-sse-heartbeat");
        t.setDaemon(true);
        return t;
    });

    public AnalyticsService(AudioListenRepository audioListenRepository,
                            DwellRepository dwellRepository,
                            PoiRepository poiRepository) {
        this.audioListenRepository = audioListenRepository;
        this.dwellRepository = dwellRepository;
        this.poiRepository = poiRepository;

        // Định kỳ gửi heartbeat giữ kết nối SSE và dọn dẹp các session hết hạn
        this.heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                int count = getActiveVisitorsCount();
                broadcastActiveVisitors(count);
            } catch (Exception ignored) {
            }
        }, 5, 5, TimeUnit.SECONDS);
    }

    public SseEmitter subscribeVisitors() {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 phút timeout, browser tự động reconnect
        visitorEmitters.add(emitter);

        emitter.onCompletion(() -> visitorEmitters.remove(emitter));
        emitter.onTimeout(() -> {
            visitorEmitters.remove(emitter);
            emitter.complete();
        });
        emitter.onError(e -> visitorEmitters.remove(emitter));

        // Gửi ngay số liệu hiện tại cho client vừa kết nối
        try {
            int currentCount = getActiveVisitorsCount();
            emitter.send(SseEmitter.event()
                    .name("visitors")
                    .data(Map.of(
                            "activeVisitors", currentCount,
                            "timestamp", System.currentTimeMillis()
                    )));
        } catch (IOException e) {
            visitorEmitters.remove(emitter);
        }

        return emitter;
    }

    public int recordVisitorPing(String deviceId) {
        String key = (deviceId != null && !deviceId.isBlank()) ? deviceId.trim() : UUID.randomUUID().toString();
        activeVisitorsMap.put(key, System.currentTimeMillis());
        int count = getActiveVisitorsCount();
        broadcastActiveVisitors(count);
        return count;
    }

    public int recordVisitorLeave(String deviceId) {
        if (deviceId != null && !deviceId.isBlank()) {
            activeVisitorsMap.remove(deviceId.trim());
        }
        int count = getActiveVisitorsCount();
        broadcastActiveVisitors(count);
        return count;
    }

    public int getActiveVisitorsCount() {
        long now = System.currentTimeMillis();
        // Xóa session quá 45 giây không phản hồi
        activeVisitorsMap.entrySet().removeIf(entry -> now - entry.getValue() > 45_000);
        int realTimeCount = activeVisitorsMap.size();
        int dbCount = dwellRepository.countActiveVisitors();
        return Math.max(1, Math.max(realTimeCount, dbCount));
    }

    public void broadcastActiveVisitors(int count) {
        if (visitorEmitters.isEmpty()) return;

        Map<String, Object> payload = Map.of(
                "activeVisitors", count,
                "timestamp", System.currentTimeMillis()
        );

        for (SseEmitter emitter : visitorEmitters) {
            try {
                emitter.send(SseEmitter.event().name("visitors").data(payload));
            } catch (Exception e) {
                visitorEmitters.remove(emitter);
            }
        }
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
        List<HotspotPoiSummary> topHotspots = dwellRepository.findTopHotspots(20);

        // 4. System overview
        int totalTours = dwellRepository.countTotalTours();
        int avgTourDurationMinutes = dwellRepository.avgTourDurationMinutes();
        int totalCheckins = dwellRepository.countTotalCheckins();
        int totalReviews = dwellRepository.countTotalReviews();
        int totalFavorites = dwellRepository.countTotalFavorites();
        int activeVisitors = getActiveVisitorsCount();

        DashboardSummaryResponse.SystemOverviewMetrics systemOverview = new DashboardSummaryResponse.SystemOverviewMetrics(
                totalTours,
                avgTourDurationMinutes,
                totalCheckins,
                totalReviews,
                totalFavorites,
                activeVisitors
        );

        return new DashboardSummaryResponse(audioStats, dwellStats, topHotspots, systemOverview);
    }
}
