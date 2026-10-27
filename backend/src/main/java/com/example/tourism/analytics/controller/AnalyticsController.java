package com.example.tourism.analytics.controller;

import com.example.tourism.analytics.dto.*;
import com.example.tourism.analytics.service.AnalyticsService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(originPatterns = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/v1/analytics/realtime/visitors
     * Server-Sent Events (SSE) stream kết nối thời gian thực cho trang Admin.
     */
    @GetMapping(value = "/realtime/visitors", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamActiveVisitors() {
        return analyticsService.subscribeVisitors();
    }

    /**
     * POST /api/v1/analytics/realtime/ping
     * Heartbeat tín hiệu thiết bị du khách đang online.
     */
    @PostMapping("/realtime/ping")
    public ResponseEntity<Map<String, Object>> pingVisitor(
            @RequestBody(required = false) Map<String, String> body) {
        String deviceId = body != null ? body.get("deviceId") : null;
        int count = analyticsService.recordVisitorPing(deviceId);
        return ResponseEntity.ok(Map.of("status", "OK", "activeVisitors", count));
    }

    /**
     * POST /api/v1/analytics/realtime/leave
     * Báo hiệu thiết bị rời trang.
     */
    @PostMapping("/realtime/leave")
    public ResponseEntity<Map<String, Object>> leaveVisitor(
            @RequestBody(required = false) Map<String, String> body) {
        String deviceId = body != null ? body.get("deviceId") : null;
        int count = analyticsService.recordVisitorLeave(deviceId);
        return ResponseEntity.ok(Map.of("status", "OK", "activeVisitors", count));
    }

    /**
     * POST /api/v1/analytics/listen
     * Ghi nhận dữ liệu thống kê lượt nghe audio thuyết minh.
     */
    @PostMapping("/listen")
    public ResponseEntity<AudioListenResponse> recordAudioListen(
            @Valid @RequestBody AudioListenRequest request,
            @CurrentUser(required = false) AuthUser user) {
        Long userId = user != null ? user.id() : null;
        AudioListenResponse response = analyticsService.recordAudioListen(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/analytics/dwell
     * Ghi nhận thời gian du khách nán lại khu vực để phát hiện các điểm nóng du lịch.
     */
    @PostMapping("/dwell")
    public ResponseEntity<DwellEventResponse> recordDwellEvent(
            @Valid @RequestBody DwellEventRequest request,
            @CurrentUser(required = false) AuthUser user) {
        Long userId = user != null ? user.id() : null;
        DwellEventResponse response = analyticsService.recordDwellEvent(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/analytics/heatmap (Admin / Khách dùng thử)
     * Trả về GeoJSON Heatmap các vệt đường & điểm nóng đông đúc nhất.
     */
    @GetMapping("/heatmap")
    public ResponseEntity<HeatmapGeoJsonResponse> getHeatmap(
            @CurrentUser(required = false) AuthUser user,
            @RequestParam(defaultValue = "30") int minDwellSeconds,
            @RequestParam(defaultValue = "500") int limit) {
        HeatmapGeoJsonResponse response = analyticsService.getHeatmap(minDwellSeconds, limit);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/analytics/dashboard-summary (Admin / Khách dùng thử)
     * Báo cáo tổng quan lượt nghe, top quán hot, thời lượng tour, và tương tác cộng đồng.
     */
    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @CurrentUser(required = false) AuthUser user) {
        DashboardSummaryResponse response = analyticsService.getDashboardSummary();
        return ResponseEntity.ok(response);
    }
}
