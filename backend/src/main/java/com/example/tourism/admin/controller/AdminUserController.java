package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.AdminUserResponse;
import com.example.tourism.admin.service.AdminUserService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
     * GET /api/v1/admin/users
     * Lấy danh sách tài khoản người dùng đăng ký qua Google hoặc Phone (loại trừ guest)
     * kèm thống kê lượt nghe audio và check-in POI.
     */
    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getAdminUsers(@CurrentUser AuthUser user) {
        requireAdmin(user);
        List<AdminUserResponse> users = adminUserService.getAdminUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * PUT /api/v1/admin/users/{id}/role
     * Thay đổi vai trò (ROLE_ADMIN <-> ROLE_USER) trực tiếp.
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @CurrentUser AuthUser currentUser,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        requireAdmin(currentUser);
        String role = body.get("role");
        adminUserService.updateUserRole(currentUser.id(), id, role);
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật vai trò người dùng thành công.",
                "userId", id,
                "role", role
        ));
    }

    /**
     * PUT /api/v1/admin/users/{id}/lock
     * Khóa hoặc mở khóa tài khoản người dùng.
     */
    @PutMapping("/{id}/lock")
    public ResponseEntity<Map<String, Object>> updateUserLockStatus(
            @CurrentUser AuthUser currentUser,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        requireAdmin(currentUser);
        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        adminUserService.updateUserLockStatus(currentUser.id(), id, locked);
        return ResponseEntity.ok(Map.of(
                "message", locked ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công.",
                "userId", id,
                "locked", locked
        ));
    }

    /**
     * DELETE /api/v1/admin/users/{id}
     * Xóa vĩnh viễn tài khoản người dùng và dọn dẹp các ràng buộc liên quan.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @CurrentUser AuthUser currentUser,
            @PathVariable Long id) {
        requireAdmin(currentUser);
        adminUserService.deleteUser(currentUser.id(), id);
        return ResponseEntity.ok(Map.of(
                "message", "Xóa tài khoản người dùng thành công.",
                "userId", id
        ));
    }
}
