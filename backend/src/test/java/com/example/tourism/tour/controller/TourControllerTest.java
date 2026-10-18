package com.example.tourism.tour.controller;

import com.example.tourism.poi.dto.PoiSummaryResponse;
import com.example.tourism.tour.dto.*;
import com.example.tourism.tour.service.TourService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TourControllerTest {

    private MockMvc mockMvc;
    private TourService tourService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tourService = mock(TourService.class);
        TourController controller = new TourController(tourService);
        com.example.tourism.auth.util.JwtUtils jwtUtils = mock(com.example.tourism.auth.util.JwtUtils.class);
        com.example.tourism.auth.resolver.CurrentUserArgumentResolver resolver =
                new com.example.tourism.auth.resolver.CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new com.example.tourism.common.exception.GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    private TourDetailResponse createSampleTourDetail(Long id, String name, String slug, boolean isPublic) {
        PoiSummaryResponse poiSummary = new PoiSummaryResponse(
                1L, "Quán Ốc Oanh", "quan-oc-oanh", "534 Vĩnh Khánh", "https://example.com/oc.jpg",
                BigDecimal.valueOf(4.6), 320, 50000, 200000, "Ốc & Hải sản", "FOOD",
                106.7025, 10.7612, 150.0
        );
        TourStopDetailResponse stop = new TourStopDetailResponse(
                10L, 1, 45, "Ốc hương sốt trứng muối", "Nên gọi bánh mì nóng", poiSummary
        );
        return new TourDetailResponse(
                id, name, slug, "Mô tả tour ẩm thực", "FOOD", 90, 150000, 1200,
                "https://example.com/thumb.jpg", isPublic, null, "ADMIN", "Hệ thống Smart Tourism",
                LocalDateTime.now(), LocalDateTime.now(), List.of(stop)
        );
    }

    @Test
    void getTours_returnsOkWithList() throws Exception {
        TourSummaryResponse t = new TourSummaryResponse(
                1L, "Foodtour Đêm Phố Ốc Vĩnh Khánh", "foodtour-dem-pho-oc-vinh-khanh",
                "Mô tả tour", "FOOD", 120, 250000, 1200, "https://example.com/img.jpg",
                2, true, null, "ADMIN", "Hệ thống Smart Tourism", LocalDateTime.now()
        );

        when(tourService.getTours(any(), any(), any(), any())).thenReturn(List.of(t));

        mockMvc.perform(get("/api/v1/tours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Foodtour Đêm Phố Ốc Vĩnh Khánh"))
                .andExpect(jsonPath("$[0].theme").value("FOOD"))
                .andExpect(jsonPath("$[0].stopCount").value(2));
    }

    @Test
    void getTourById_found_returnsOk() throws Exception {
        TourDetailResponse detail = createSampleTourDetail(1L, "Foodtour Đêm Phố Ốc Vĩnh Khánh", "foodtour-dem-pho-oc-vinh-khanh", true);
        when(tourService.getTourByIdOrSlug(eq("1"), any())).thenReturn(detail);

        mockMvc.perform(get("/api/v1/tours/{tourId}", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Foodtour Đêm Phố Ốc Vĩnh Khánh"))
                .andExpect(jsonPath("$.stops[0].recommendedDishOrActivity").value("Ốc hương sốt trứng muối"))
                .andExpect(jsonPath("$.stops[0].poi.name").value("Quán Ốc Oanh"));
    }

    @Test
    void getTourById_notFound_returns404() throws Exception {
        when(tourService.getTourByIdOrSlug(eq("999"), any()))
                .thenThrow(new IllegalArgumentException("Không tìm thấy tour"));

        mockMvc.perform(get("/api/v1/tours/{tourId}", "999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void getTourById_privateForbidden_returns403() throws Exception {
        when(tourService.getTourByIdOrSlug(eq("private-tour"), any()))
                .thenThrow(new SecurityException("Tour này ở chế độ riêng tư"));

        mockMvc.perform(get("/api/v1/tours/{tourId}", "private-tour"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createTour_valid_returns201() throws Exception {
        CreateTourStopRequest s1 = new CreateTourStopRequest(1L, 1, 45, "Ốc hương trứng muối", "Ghi chú");
        CreateTourRequest req = new CreateTourRequest(
                "Tour Ẩm Thực Tự Tạo", "Mô tả", "FOOD", 90, 200000, 1000, null, true, "Du khách", List.of(s1)
        );

        TourDetailResponse detail = createSampleTourDetail(5L, "Tour Ẩm Thực Tự Tạo", "tour-am-thuc-tu-tao", true);
        when(tourService.createTour(any(), any(), any())).thenReturn(detail);

        mockMvc.perform(post("/api/v1/tours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.name").value("Tour Ẩm Thực Tự Tạo"));
    }

    @Test
    void createTour_blankName_returns400() throws Exception {
        CreateTourRequest req = new CreateTourRequest(
                "", "Mô tả", "FOOD", 90, 200000, 1000, null, true, "Du khách",
                List.of(new CreateTourStopRequest(1L, 1, 30, null, null))
        );

        mockMvc.perform(post("/api/v1/tours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").value("Tên tour không được để trống."));
    }

    @Test
    void generateCustomPlan_valid_returnsOk() throws Exception {
        CustomPlanRequest req = new CustomPlanRequest(
                90, 10.7612, 106.7025, List.of(1L, 3L), List.of("FOOD"), 200000, false, null, null
        );

        PoiSummaryResponse poiSummary = new PoiSummaryResponse(
                1L, "Quán Ốc Oanh", "quan-oc-oanh", "534 Vĩnh Khánh", null,
                BigDecimal.valueOf(4.6), 320, 50000, 200000, "Ốc & Hải sản", "FOOD",
                106.7025, 10.7612, 0.0
        );
        CustomPlanStopResponse stop = new CustomPlanStopResponse(
                1, poiSummary, 40, 0, 0.0, "Ốc hương sốt trứng muối", "Điểm dừng 1"
        );
        CustomPlanResponse plan = new CustomPlanResponse(
                90, 40, 50, 50000, 0, 1, List.of(stop), null
        );

        when(tourService.generateCustomPlan(any(), any(), any())).thenReturn(plan);

        mockMvc.perform(post("/api/v1/tours/custom-plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableMinutes").value(90))
                .andExpect(jsonPath("$.totalDurationMinutes").value(40))
                .andExpect(jsonPath("$.remainingMinutes").value(50))
                .andExpect(jsonPath("$.stopCount").value(1))
                .andExpect(jsonPath("$.stops[0].poi.name").value("Quán Ốc Oanh"));
    }

    @Test
    void generateCustomPlan_invalidTime_returns400() throws Exception {
        CustomPlanRequest req = new CustomPlanRequest(
                10, 10.7612, 106.7025, List.of(), List.of(), null, false, null, null
        );

        mockMvc.perform(post("/api/v1/tours/custom-plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Quỹ thời gian (availableMinutes) tối thiểu là 15 phút."));
    }
}

