package com.example.tourism.analytics.service;

import com.example.tourism.analytics.dto.*;
import com.example.tourism.analytics.model.AudioListenLog;
import com.example.tourism.analytics.model.DwellLog;
import com.example.tourism.analytics.repository.AudioListenRepository;
import com.example.tourism.analytics.repository.DwellRepository;
import com.example.tourism.common.exception.ResourceNotFoundException;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.repository.PoiRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService Unit Tests")
class AnalyticsServiceTest {

    @Mock
    private AudioListenRepository audioListenRepository;

    @Mock
    private DwellRepository dwellRepository;

    @Mock
    private PoiRepository poiRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    @DisplayName("recordAudioListen: should save and return response when POI exists")
    void recordAudioListen_success() {
        AudioListenRequest req = new AudioListenRequest("dev-123", 1L, 60, true, "AUTO");
        Poi poi = new Poi();
        poi.setId(1L);
        poi.setName("Quán Ốc Oanh");

        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));

        AudioListenResponse expected = new AudioListenResponse(
                10L, "dev-123", 5L, 1L, "Quán Ốc Oanh", 60, true, "AUTO", LocalDateTime.now()
        );
        when(audioListenRepository.save(any(AudioListenLog.class), eq("Quán Ốc Oanh"))).thenReturn(expected);

        AudioListenResponse res = analyticsService.recordAudioListen(req, 5L);

        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(10L);
        assertThat(res.poiName()).isEqualTo("Quán Ốc Oanh");
        assertThat(res.triggerType()).isEqualTo("AUTO");
        assertThat(res.completed()).isTrue();
        verify(audioListenRepository, times(1)).save(any(AudioListenLog.class), eq("Quán Ốc Oanh"));
    }

    @Test
    @DisplayName("recordAudioListen: should throw ResourceNotFoundException when POI does not exist")
    void recordAudioListen_poiNotFound() {
        AudioListenRequest req = new AudioListenRequest("dev-123", 999L, 30, false, "MANUAL");
        when(poiRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.recordAudioListen(req, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy địa điểm");

        verify(audioListenRepository, never()).save(any(), any());
    }

    @Test
    @DisplayName("recordDwellEvent: should link matched POI when within 50m")
    void recordDwellEvent_matchedPoi() {
        DwellEventRequest req = new DwellEventRequest("dev-123", 10.7612, 106.7025, 180);
        when(dwellRepository.findNearestPoi(10.7612, 106.7025, 50.0))
                .thenReturn(Optional.of(new DwellRepository.PoiMatch(1L, "Quán Ốc Oanh")));

        DwellEventResponse expected = new DwellEventResponse(
                5L, "dev-123", 2L, 10.7612, 106.7025, 180, 1L, "Quán Ốc Oanh", LocalDateTime.now()
        );
        when(dwellRepository.save(any(DwellLog.class), eq("Quán Ốc Oanh"))).thenReturn(expected);

        DwellEventResponse res = analyticsService.recordDwellEvent(req, 2L);

        assertThat(res).isNotNull();
        assertThat(res.matchedPoiId()).isEqualTo(1L);
        assertThat(res.matchedPoiName()).isEqualTo("Quán Ốc Oanh");
        assertThat(res.dwellSeconds()).isEqualTo(180);
    }

    @Test
    @DisplayName("recordDwellEvent: should set matchedPoiId null when far from any POI")
    void recordDwellEvent_noMatch() {
        DwellEventRequest req = new DwellEventRequest("dev-123", 10.7500, 106.7000, 120);
        when(dwellRepository.findNearestPoi(10.7500, 106.7000, 50.0))
                .thenReturn(Optional.empty());

        DwellEventResponse expected = new DwellEventResponse(
                6L, "dev-123", null, 10.7500, 106.7000, 120, null, null, LocalDateTime.now()
        );
        when(dwellRepository.save(any(DwellLog.class), isNull())).thenReturn(expected);

        DwellEventResponse res = analyticsService.recordDwellEvent(req, null);

        assertThat(res).isNotNull();
        assertThat(res.matchedPoiId()).isNull();
        assertThat(res.matchedPoiName()).isNull();
    }

    @Test
    @DisplayName("getHeatmap: should return GeoJSON feature collection")
    void getHeatmap_success() {
        Map<String, Object> props = Map.of("dwellSeconds", 180, "intensity", 0.75);
        HeatmapGeoJsonResponse.HeatmapFeature feature = HeatmapGeoJsonResponse.HeatmapFeature.point(106.7025, 10.7612, props);
        HeatmapGeoJsonResponse expected = HeatmapGeoJsonResponse.of(List.of(feature));

        when(dwellRepository.findHeatmapFeatures(30, 100)).thenReturn(expected);

        HeatmapGeoJsonResponse res = analyticsService.getHeatmap(30, 100);

        assertThat(res).isNotNull();
        assertThat(res.type()).isEqualTo("FeatureCollection");
        assertThat(res.features()).hasSize(1);
        assertThat(res.features().get(0).geometry().coordinates()).containsExactly(106.7025, 10.7612);
    }

    @Test
    @DisplayName("getDashboardSummary: should aggregate stats from audio, dwell and system")
    void getDashboardSummary_success() {
        when(audioListenRepository.countTotalListens()).thenReturn(100L);
        when(audioListenRepository.countCompletedListens()).thenReturn(80L);
        when(audioListenRepository.sumListenSeconds()).thenReturn(9000L);
        when(audioListenRepository.avgListenSeconds()).thenReturn(90.0);
        when(audioListenRepository.countByTriggerType("AUTO")).thenReturn(60L);
        when(audioListenRepository.countByTriggerType("MANUAL")).thenReturn(40L);

        when(dwellRepository.countTotalDwellEvents()).thenReturn(200L);
        when(dwellRepository.sumDwellMinutes()).thenReturn(500.0);
        when(dwellRepository.avgDwellMinutes()).thenReturn(2.5);

        HotspotPoiSummary hotspot = new HotspotPoiSummary(1L, "Quán Ốc Oanh", "Ốc & Hải sản", 45, 30, 120.0, 4.8);
        when(dwellRepository.findTopHotspots(5)).thenReturn(List.of(hotspot));

        when(dwellRepository.countTotalTours()).thenReturn(4);
        when(dwellRepository.avgTourDurationMinutes()).thenReturn(110);
        when(dwellRepository.countTotalCheckins()).thenReturn(55);
        when(dwellRepository.countTotalReviews()).thenReturn(38);
        when(dwellRepository.countTotalFavorites()).thenReturn(72);

        DashboardSummaryResponse res = analyticsService.getDashboardSummary();

        assertThat(res).isNotNull();
        assertThat(res.audioStats().totalListens()).isEqualTo(100L);
        assertThat(res.audioStats().completedListens()).isEqualTo(80L);
        assertThat(res.audioStats().completionRate()).isEqualTo(80.0);
        assertThat(res.audioStats().autoTriggeredListens()).isEqualTo(60L);

        assertThat(res.dwellStats().totalDwellEvents()).isEqualTo(200L);
        assertThat(res.dwellStats().totalDwellMinutes()).isEqualTo(500.0);

        assertThat(res.topHotspots()).hasSize(1);
        assertThat(res.topHotspots().get(0).poiName()).isEqualTo("Quán Ốc Oanh");

        assertThat(res.systemOverview().totalTours()).isEqualTo(4);
        assertThat(res.systemOverview().totalCheckins()).isEqualTo(55);
    }
}

