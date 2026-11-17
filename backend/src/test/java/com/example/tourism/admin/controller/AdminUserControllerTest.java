package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.AdminUserResponse;
import com.example.tourism.admin.service.AdminUserService;
import com.example.tourism.auth.resolver.CurrentUserArgumentResolver;
import com.example.tourism.auth.util.JwtUtils;
import com.example.tourism.common.exception.GlobalExceptionHandler;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserController Unit Tests")
class AdminUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminUserService adminUserService;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AdminUserController adminUserController;

    @BeforeEach
    void setUp() {
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - thành công khi role là ADMIN")
    void getAdminUsers_success_whenAdmin() throws Exception {
        String token = "valid-admin-token";
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserIdFromToken(token)).thenReturn(1L);
        when(jwtUtils.getRoleFromToken(token)).thenReturn("ADMIN");

        AdminUserResponse user1 = new AdminUserResponse(
                10L,
                "nguyenvana@gmail.com",
                "Nguyễn Văn A",
                "https://lh3.googleusercontent.com/photo.jpg",
                "google",
                "google-sub-123",
                "ROLE_USER",
                false,
                5L,
                2L,
                LocalDateTime.now()
        );

        AdminUserResponse user2 = new AdminUserResponse(
                11L,
                null,
                "Người dùng 7890",
                null,
                "phone",
                "0901237890",
                "ROLE_USER",
                false,
                12L,
                4L,
                LocalDateTime.now()
        );

        when(adminUserService.getAdminUsers()).thenReturn(List.of(user1, user2));

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].displayName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$[0].provider").value("google"))
                .andExpect(jsonPath("$[0].listenCount").value(5))
                .andExpect(jsonPath("$[0].checkinCount").value(2))
                .andExpect(jsonPath("$[1].displayName").value("Người dùng 7890"))
                .andExpect(jsonPath("$[1].provider").value("phone"))
                .andExpect(jsonPath("$[1].providerId").value("0901237890"))
                .andExpect(jsonPath("$[1].listenCount").value(12))
                .andExpect(jsonPath("$[1].checkinCount").value(4));

        verify(adminUserService, times(1)).getAdminUsers();
    }

    @Test
    @DisplayName("PUT /api/v1/admin/users/{id}/role - đổi quyền thành công")
    void updateUserRole_success() throws Exception {
        String token = "valid-admin-token";
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserIdFromToken(token)).thenReturn(1L);
        when(jwtUtils.getRoleFromToken(token)).thenReturn("ADMIN");

        mockMvc.perform(put("/api/v1/admin/users/10/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ROLE_ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));

        verify(adminUserService, times(1)).updateUserRole(1L, 10L, "ROLE_ADMIN");
    }

    @Test
    @DisplayName("PUT /api/v1/admin/users/{id}/lock - khóa tài khoản thành công")
    void updateUserLockStatus_success() throws Exception {
        String token = "valid-admin-token";
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserIdFromToken(token)).thenReturn(1L);
        when(jwtUtils.getRoleFromToken(token)).thenReturn("ADMIN");

        mockMvc.perform(put("/api/v1/admin/users/10/lock")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"locked\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.locked").value(true));

        verify(adminUserService, times(1)).updateUserLockStatus(1L, 10L, true);
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/users/{id} - xóa tài khoản thành công")
    void deleteUser_success() throws Exception {
        String token = "valid-admin-token";
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserIdFromToken(token)).thenReturn(1L);
        when(jwtUtils.getRoleFromToken(token)).thenReturn("ADMIN");

        mockMvc.perform(delete("/api/v1/admin/users/10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10));

        verify(adminUserService, times(1)).deleteUser(1L, 10L);
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - 403 Forbidden khi user không phải ADMIN")
    void getAdminUsers_forbidden_whenNotAdmin() throws Exception {
        String token = "user-token";
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserIdFromToken(token)).thenReturn(2L);
        when(jwtUtils.getRoleFromToken(token)).thenReturn("USER");

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        verify(adminUserService, never()).getAdminUsers();
    }
}
