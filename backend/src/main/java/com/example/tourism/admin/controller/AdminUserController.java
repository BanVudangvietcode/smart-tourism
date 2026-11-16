package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.AdminUserResponse;
import com.example.tourism.admin.service.AdminUserService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/users", "/api/admin/users"})
@CrossOrigin(originPatterns = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    private void requireAdmin(AuthUser user) {
        if (user == null || (!"ADMIN".equalsIgnoreCase(user.role()) && !"ROLE_ADMIN".equalsIgnoreCase(user.role()))) {
            throw new SecurityException("Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (ADMIN).");
        }
    }

    /**
     * GET /api/v1/admin/users hoặc GET /api/admin/users
     * Lấy danh sách tài khoản người dùng đăng ký qua Google hoặc Phone (loại trừ guest)
     * kèm thống kê lượt nghe audio và check-in POI.
     */
    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getAdminUsers(@CurrentUser AuthUser user) {
        requireAdmin(user);
        List<AdminUserResponse> users = adminUserService.getAdminUsers();
        return ResponseEntity.ok(users);
    }
}
