package com.example.tourism.analytics.controller;

import com.example.tourism.analytics.dto.*;
import com.example.tourism.analytics.service.AnalyticsService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
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
     * GET /api/v1/analytics/heatmap (Admin)
     * Trả về GeoJSON Heatmap các vệt đường & điểm nóng đông đúc nhất.
     */
    @GetMapping("/heatmap")
    public ResponseEntity<HeatmapGeoJsonResponse> getHeatmap(
            @CurrentUser AuthUser user,
            @RequestParam(defaultValue = "30") int minDwellSeconds,
            @RequestParam(defaultValue = "500") int limit) {
        if (user == null || !user.isAdmin()) {
            throw new SecurityException("Yêu cầu quyền Quản trị viên (Admin) để xem Heatmap");
        }
        HeatmapGeoJsonResponse response = analyticsService.getHeatmap(minDwellSeconds, limit);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/analytics/dashboard-summary (Admin)
     * Báo cáo tổng quan lượt nghe, top quán hot, thời lượng tour, và tương tác cộng đồng.
     */
    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @CurrentUser AuthUser user) {
        if (user == null || !user.isAdmin()) {
            throw new SecurityException("Yêu cầu quyền Quản trị viên (Admin) để xem Báo cáo Dashboard");
        }
        DashboardSummaryResponse response = analyticsService.getDashboardSummary();
        return ResponseEntity.ok(response);
    }
}

