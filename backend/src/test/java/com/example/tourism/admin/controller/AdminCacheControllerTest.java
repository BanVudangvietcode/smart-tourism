package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.EvictCacheRequest;
import com.example.tourism.admin.dto.EvictCacheResponse;
import com.example.tourism.admin.service.AdminCacheService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminCacheController Unit Tests")
class AdminCacheControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminCacheService adminCacheService;

    @InjectMocks
    private AdminCacheController adminCacheController;

    @BeforeEach
    void setUp() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(adminCacheController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    @DisplayName("POST /api/v1/admin/cache/evict: should return 200 OK for Admin with pattern")
    void evictCache_adminSuccess() throws Exception {
        EvictCacheRequest req = new EvictCacheRequest("poi:*");
        EvictCacheResponse res = new EvictCacheResponse(
                "poi:*",
                3,
                List.of("poi:detail:1", "poi:detail:2", "poi:detail:3"),
                "Đã cưỡng chế xóa 3 khóa cache Redis khớp với mẫu 'poi:*'."
        );

        when(adminCacheService.evictCache(eq("poi:*"))).thenReturn(res);

        mockMvc.perform(post("/api/v1/admin/cache/evict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pattern").value("poi:*"))
                .andExpect(jsonPath("$.evictedCount").value(3))
                .andExpect(jsonPath("$.evictedKeys[0]").value("poi:detail:1"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/cache/evict: should return 200 OK when request body is empty (default pattern)")
    void evictCache_defaultPattern() throws Exception {
        EvictCacheResponse res = new EvictCacheResponse(
                "poi:*",
                0,
                List.of(),
                "Đã cưỡng chế xóa 0 khóa cache Redis khớp với mẫu 'poi:*'."
        );

        when(adminCacheService.evictCache(eq("poi:*"))).thenReturn(res);

        mockMvc.perform(post("/api/v1/admin/cache/evict")
                        .requestAttr("userId", 1L)
                        .requestAttr("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pattern").value("poi:*"))
                .andExpect(jsonPath("$.evictedCount").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/admin/cache/evict: should return 403 Forbidden for non-admin")
    void evictCache_forbiddenForUser() throws Exception {
        mockMvc.perform(post("/api/v1/admin/cache/evict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pattern\": \"poi:*\"}")
                        .requestAttr("userId", 2L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Yêu cầu quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này."));
    }
}

