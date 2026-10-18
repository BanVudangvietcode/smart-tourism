package com.example.tourism.analytics.controller;

import com.example.tourism.analytics.dto.*;
import com.example.tourism.analytics.service.AnalyticsService;
import com.example.tourism.auth.resolver.CurrentUserArgumentResolver;
import com.example.tourism.auth.util.JwtUtils;
import com.example.tourism.common.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsController Unit Tests")
class AnalyticsControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AnalyticsController analyticsController;

    @BeforeEach
    void setUp() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    @DisplayName("POST /api/v1/analytics/listen: should return 201 Created on valid listen telemetry")
    void recordAudioListen_returns201() throws Exception {
        AudioListenRequest req = new AudioListenRequest("dev-phone-123", 1L, 75, true, "AUTO");
        AudioListenResponse res = new AudioListenResponse(
                1L, "dev-phone-123", 2L, 1L, "Quán Ốc Oanh", 75, true, "AUTO", LocalDateTime.now()
        );

        when(analyticsService.recordAudioListen(any(AudioListenRequest.class), eq(2L))).thenReturn(res);

        mockMvc.perform(post("/api/v1/analytics/listen")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.deviceId").value("dev-phone-123"))
                .andExpect(jsonPath("$.poiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.triggerType").value("AUTO"));
    }

    @Test
    @DisplayName("POST /api/v1/analytics/listen: should return 400 Bad Request on validation error")
    void recordAudioListen_validationError() throws Exception {
        // Missing deviceId and negative durationSeconds
        String invalidJson = """
            {
              "deviceId": "",
              "poiId": 1,
              "durationSeconds": -5,
              "completed": true,
              "triggerType": "INVALID_TYPE"
            }
            """;

        mockMvc.perform(post("/api/v1/analytics/listen")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.deviceId").exists())
                .andExpect(jsonPath("$.errors.durationSeconds").exists())
                .andExpect(jsonPath("$.errors.triggerType").exists());

        verify(analyticsService, never()).recordAudioListen(any(), any());
    }

    @Test
    @DisplayName("POST /api/v1/analytics/dwell: should return 201 Created on valid dwell event")
    void recordDwellEvent_returns201() throws Exception {
        DwellEventRequest req = new DwellEventRequest("dev-phone-123", 10.7612, 106.7025, 180);
        DwellEventResponse res = new DwellEventResponse(
                2L, "dev-phone-123", null, 10.7612, 106.7025, 180, 1L, "Quán Ốc Oanh", LocalDateTime.now()
        );

        when(analyticsService.recordDwellEvent(any(DwellEventRequest.class), isNull())).thenReturn(res);

        mockMvc.perform(post("/api/v1/analytics/dwell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2L))
                .andExpect(jsonPath("$.matchedPoiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.dwellSeconds").value(180));
    }

    @Test
    @DisplayName("POST /api/v1/analytics/dwell: should return 400 Bad Request on invalid coordinates or zero dwell")
    void recordDwellEvent_validationError() throws Exception {
        String invalidJson = """
            {
              "deviceId": "dev-01",
              "lat": 150.0,
              "lng": -200.0,
              "dwellSeconds": 0
            }
            """;

        mockMvc.perform(post("/api/v1/analytics/dwell")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.lat").exists())
                .andExpect(jsonPath("$.errors.lng").exists())
                .andExpect(jsonPath("$.errors.dwellSeconds").exists());

        verify(analyticsService, never()).recordDwellEvent(any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/heatmap: should return 200 OK for Admin user")
    void getHeatmap_adminSuccess() throws Exception {
        Map<String, Object> props = Map.of("dwellSeconds", 180, "intensity", 0.8);
        HeatmapGeoJsonResponse.HeatmapFeature feature = HeatmapGeoJsonResponse.HeatmapFeature.point(106.7025, 10.7612, props);
        HeatmapGeoJsonResponse res = HeatmapGeoJsonResponse.of(List.of(feature));

        when(analyticsService.getHeatmap(30, 500)).thenReturn(res);

        mockMvc.perform(get("/api/v1/analytics/heatmap")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("FeatureCollection"))
                .andExpect(jsonPath("$.features[0].geometry.coordinates[0]").value(106.7025))
                .andExpect(jsonPath("$.features[0].geometry.coordinates[1]").value(10.7612));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/heatmap: should return 403 Forbidden for non-Admin user")
    void getHeatmap_nonAdminForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/heatmap")
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Yêu cầu quyền Quản trị viên (Admin) để xem Heatmap"));

        verify(analyticsService, never()).getHeatmap(anyInt(), anyInt());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/heatmap: should return 403 Forbidden when unauthenticated")
    void getHeatmap_unauthenticatedForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/heatmap"))
                .andExpect(status().isForbidden());

        verify(analyticsService, never()).getHeatmap(anyInt(), anyInt());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/dashboard-summary: should return 200 OK for Admin user")
    void getDashboardSummary_adminSuccess() throws Exception {
        DashboardSummaryResponse.AudioListenMetrics audio = new DashboardSummaryResponse.AudioListenMetrics(
                120, 90, 75.0, 300, 150.0, 70, 50
        );
        DashboardSummaryResponse.DwellMetrics dwell = new DashboardSummaryResponse.DwellMetrics(
                250, 650.0, 2.6
        );
        HotspotPoiSummary hotspot = new HotspotPoiSummary(1L, "Quán Ốc Oanh", "Ốc", 50, 40, 180.0, 4.9);
        DashboardSummaryResponse.SystemOverviewMetrics overview = new DashboardSummaryResponse.SystemOverviewMetrics(
                4, 110, 50, 40, 80
        );

        DashboardSummaryResponse res = new DashboardSummaryResponse(audio, dwell, List.of(hotspot), overview);

        when(analyticsService.getDashboardSummary()).thenReturn(res);

        mockMvc.perform(get("/api/v1/analytics/dashboard-summary")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audioStats.totalListens").value(120))
                .andExpect(jsonPath("$.audioStats.completionRate").value(75.0))
                .andExpect(jsonPath("$.dwellStats.totalDwellEvents").value(250))
                .andExpect(jsonPath("$.topHotspots[0].poiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.systemOverview.totalTours").value(4));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/dashboard-summary: should return 403 Forbidden for non-Admin user")
    void getDashboardSummary_nonAdminForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard-summary")
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Yêu cầu quyền Quản trị viên (Admin) để xem Báo cáo Dashboard"));

        verify(analyticsService, never()).getDashboardSummary();
    }
}

