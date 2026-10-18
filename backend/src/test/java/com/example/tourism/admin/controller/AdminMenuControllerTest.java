package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.*;
import com.example.tourism.admin.service.AdminMenuService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMenuController Unit Tests")
class AdminMenuControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminMenuService adminMenuService;

    @InjectMocks
    private AdminMenuController adminMenuController;

    private AdminDishResponse sampleDish;

    @BeforeEach
    void setUp() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(adminMenuController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        sampleDish = new AdminDishResponse(
                50L,
                1L,
                "Quán Ốc Oanh",
                2L,
                "Món xào me",
                "Sò huyết xào me",
                "so-huyet-xao-me",
                "Sò huyết tươi xào sốt me chua ngọt",
                95000,
                110000,
                "dĩa",
                true,
                true,
                "https://example.com/so-huyet.jpg",
                List.of("Sò huyết", "Sốt me", "Đậu phộng"),
                List.of("Hải sản", "Đậu phộng"),
                true,
                true,
                false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{poiId}/menu/scan-ocr: should return 200 OK with detected dishes")
    void scanMenuOcr_adminSuccess() throws Exception {
        MockMultipartFile menuImage = new MockMultipartFile("file", "menu_via_he.jpg", "image/jpeg", "fake-image-bytes".getBytes());

        OcrMenuDraftResponse draftRes = new OcrMenuDraftResponse(
                1L,
                "Quán Ốc Oanh",
                "menu_via_he.jpg",
                2,
                List.of(
                        new DetectedDishDraft("Ốc mỡ xào me", "Món xào", 80000, true, "Ốc mỡ xào me chua ngọt", "Hải sản"),
                        new DetectedDishDraft("Trà tắc mật ong", "Đồ uống", 20000, false, "Trà tắc thanh mát", "")
                ),
                "Quét thành công bởi Gemini AI Vision."
        );

        when(adminMenuService.scanMenuOcr(eq(1L), any())).thenReturn(draftRes);

        mockMvc.perform(multipart("/api/v1/admin/pois/1/menu/scan-ocr")
                        .file(menuImage)
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(1))
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.detectedDishes[0].name").value("Ốc mỡ xào me"))
                .andExpect(jsonPath("$.detectedDishes[0].price").value(80000));
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{poiId}/menu/scan-ocr: should return 403 Forbidden for non-admin")
    void scanMenuOcr_forbiddenForUser() throws Exception {
        MockMultipartFile menuImage = new MockMultipartFile("file", "menu.jpg", "image/jpeg", "bytes".getBytes());

        mockMvc.perform(multipart("/api/v1/admin/pois/1/menu/scan-ocr")
                        .file(menuImage)
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{poiId}/dishes: should return 201 Created on adding dish")
    void createDish_adminSuccess() throws Exception {
        CreateAdminDishRequest req = new CreateAdminDishRequest(
                "Sò huyết xào me",
                "Món xào me",
                95000,
                110000,
                true,
                "Sò huyết tươi xào sốt me chua ngọt",
                "Hải sản, Đậu phộng",
                "https://example.com/so-huyet.jpg",
                "dĩa"
        );

        when(adminMenuService.createDish(eq(1L), any(CreateAdminDishRequest.class))).thenReturn(sampleDish);

        mockMvc.perform(post("/api/v1/admin/pois/1/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.name").value("Sò huyết xào me"))
                .andExpect(jsonPath("$.price").value(95000))
                .andExpect(jsonPath("$.isSignature").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{poiId}/dishes: should return 400 Bad Request on blank name")
    void createDish_validationError() throws Exception {
        CreateAdminDishRequest req = new CreateAdminDishRequest(
                "",
                "Món xào",
                -1000,
                null,
                false,
                null,
                null,
                null,
                "dĩa"
        );

        mockMvc.perform(post("/api/v1/admin/pois/1/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/dishes/{dishId}: should return 200 OK on update")
    void updateDish_adminSuccess() throws Exception {
        UpdateAdminDishRequest req = new UpdateAdminDishRequest(
                "Sò huyết xào me chua ngọt",
                "Món xào me",
                100000,
                null,
                true,
                false, // ẩn món tạm thời
                "Tạm thời hết hàng hôm nay",
                "Hải sản",
                null,
                "dĩa"
        );

        when(adminMenuService.updateDish(eq(50L), any(UpdateAdminDishRequest.class))).thenReturn(sampleDish);

        mockMvc.perform(put("/api/v1/admin/dishes/50")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/dishes/{dishId}: should return 200 OK on delete")
    void deleteDish_adminSuccess() throws Exception {
        doNothing().when(adminMenuService).deleteDish(50L);

        mockMvc.perform(delete("/api/v1/admin/dishes/50")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dishId").value(50));

        verify(adminMenuService, times(1)).deleteDish(50L);
    }

    @Test
    @DisplayName("POST /api/v1/admin/pois/{poiId}/menu/batch-import: should batch insert from CSV")
    void batchImportMenu_adminSuccess() throws Exception {
        String csvContent = """
                name,category,price,is_signature,description,allergens
                Ốc mỡ xào me,Món xào,85000,true,Ốc mỡ béo ngọt xào me,Hải sản
                Càng ghẹ rang muối,Món rang,115000,true,Càng ghẹ biển Tây Ninh,Hải sản
                """;
        MockMultipartFile csvFile = new MockMultipartFile("file", "menu.csv", "text/csv", csvContent.getBytes());

        BatchImportResponse res = new BatchImportResponse(
                1L,
                "Quán Ốc Oanh",
                "menu.csv",
                2,
                List.of("Ốc mỡ xào me", "Càng ghẹ rang muối"),
                "Đã nhập hàng loạt 2 món ăn thành công."
        );

        when(adminMenuService.batchImportMenu(eq(1L), any())).thenReturn(res);

        mockMvc.perform(multipart("/api/v1/admin/pois/1/menu/batch-import")
                        .file(csvFile)
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.poiId").value(1))
                .andExpect(jsonPath("$.importedCount").value(2))
                .andExpect(jsonPath("$.importedDishNames[0]").value("Ốc mỡ xào me"));
    }
}

