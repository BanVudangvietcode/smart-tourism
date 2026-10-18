package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.AdminPoiResponse;
import com.example.tourism.admin.dto.CreateAdminPoiRequest;
import com.example.tourism.admin.dto.UpdateAdminPoiRequest;
import com.example.tourism.admin.service.AdminPoiService;
import com.example.tourism.audio.dto.AudioCreateResponse;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminPoiController Unit Tests")
class AdminPoiControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminPoiService adminPoiService;

    @InjectMocks
    private AdminPoiController adminPoiController;

    private AdminPoiResponse samplePoi;

    @BeforeEach
    void setUp() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(adminPoiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        samplePoi = new AdminPoiResponse(
                10L,
                "Quán Ốc Đêm Khánh Hội",
                "quan-oc-dem-khanh-hoi",
                "Quán ốc mới mở với các món ốc xào me, bơ tỏi.",
                "123 Khánh Hội",
                "Quận 4",
                "Phường 3",
                "0909112233",
                "16:00 - 23:00",
                50000,
                180000,
                BigDecimal.ZERO,
                0,
                0,
                "/api/v1/audio/stream/10",
                "https://example.com/thumb.jpg",
                1L,
                "Ốc & Hải sản",
                "FOOD",
                10.7620,
                106.7010,
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois: should return 201 Created for Admin")
    void createPoi_adminSuccess() throws Exception {
        when(adminPoiService.createPoi(any(CreateAdminPoiRequest.class), any(), any(), any(), any()))
                .thenReturn(samplePoi);

        MockMultipartFile imagePart = new MockMultipartFile("image", "thumb.jpg", "image/jpeg", "image-content".getBytes());

        mockMvc.perform(multipart("/api/v1/admin/pois")
                        .file(imagePart)
                        .param("name", "Quán Ốc Đêm Khánh Hội")
                        .param("address", "123 Khánh Hội")
                        .param("district", "Quận 4")
                        .param("ward", "Phường 3")
                        .param("latitude", "10.7620")
                        .param("longitude", "106.7010")
                        .param("priceRangeMin", "50000")
                        .param("priceRangeMax", "180000")
                        .param("categoryId", "1")
                        .param("poiType", "FOOD")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Quán Ốc Đêm Khánh Hội"))
                .andExpect(jsonPath("$.latitude").value(10.7620))
                .andExpect(jsonPath("$.longitude").value(106.7010));
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois: should return 403 Forbidden for non-admin")
    void createPoi_forbiddenForNonAdmin() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/pois")
                        .param("name", "Quán Ốc")
                        .param("latitude", "10.7620")
                        .param("longitude", "106.7010")
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Yêu cầu quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này."));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/pois/{id}: should return 200 OK on update")
    void updatePoi_adminSuccess() throws Exception {
        UpdateAdminPoiRequest req = new UpdateAdminPoiRequest(
                "Quán Ốc Đêm Khánh Hội VIP",
                "Đã sửa mô tả",
                "123 Khánh Hội",
                "Quận 4",
                "Phường 3",
                "0909112233",
                "15:00 - 23:30",
                60000,
                200000,
                1L,
                "FOOD",
                10.7625,
                106.7015,
                "https://example.com/new.jpg",
                true
        );

        when(adminPoiService.updatePoi(eq(10L), any(UpdateAdminPoiRequest.class))).thenReturn(samplePoi);

        mockMvc.perform(put("/api/v1/admin/pois/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/pois/{id}: should soft delete POI and return 200 OK")
    void deletePoi_adminSuccess() throws Exception {
        doNothing().when(adminPoiService).softDeletePoi(10L);

        mockMvc.perform(delete("/api/v1/admin/pois/10")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(10))
                .andExpect(jsonPath("$.active").value(false));

        verify(adminPoiService, times(1)).softDeletePoi(10L);
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{id}/audio: should upload audio and return 200 OK")
    void uploadPoiAudio_adminSuccess() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile("file", "test.mp3", "audio/mpeg", "mp3-bytes".getBytes());
        AudioCreateResponse res = new AudioCreateResponse(
                1L, 10L, "Quán Ốc Đêm Khánh Hội", "Thuyết minh Quán Ốc Đêm", "poi_10.mp3",
                60, "01:00", 360000L, "351.6 KB", "Nữ miền Nam (Truyền cảm)", "vi", "quan4",
                "Kịch bản thuyết minh", "/api/v1/audio/stream/10", "DIRECT_UPLOAD", List.of()
        );

        when(adminPoiService.uploadPoiAudio(eq(10L), any(), any(), any(), any())).thenReturn(res);

        mockMvc.perform(multipart("/api/v1/admin/pois/10/audio")
                        .file(audioFile)
                        .param("title", "Thuyết minh Quán Ốc Đêm")
                        .param("transcript", "Kịch bản thuyết minh")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(10))
                .andExpect(jsonPath("$.fileName").value("poi_10.mp3"));
    }
}

