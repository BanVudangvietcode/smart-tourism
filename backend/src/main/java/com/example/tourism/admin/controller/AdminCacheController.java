package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.EvictCacheRequest;
import com.example.tourism.admin.dto.EvictCacheResponse;
import com.example.tourism.admin.service.AdminCacheService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/cache")
public class AdminCacheController {

    private final AdminCacheService adminCacheService;

    public AdminCacheController(AdminCacheService adminCacheService) {
        this.adminCacheService = adminCacheService;
    }

    private void requireAdmin(AuthUser user) {
        if (user == null || !user.isAdmin()) {
            throw new SecurityException("Yêu cầu quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này.");
        }
    }

    /**
     * POST /api/v1/admin/cache/evict
     * Body: { pattern: "poi:*" }
     * Ý nghĩa: Cưỡng chế xóa cache Redis khi vừa thay đổi thông tin quán/thực đơn.
     */
    @PostMapping("/evict")
    public ResponseEntity<EvictCacheResponse> evictCache(
            @CurrentUser AuthUser user,
            @RequestBody(required = false) EvictCacheRequest request) {

        requireAdmin(user);
        String pattern = (request != null && request.pattern() != null) ? request.pattern() : "poi:*";
        EvictCacheResponse response = adminCacheService.evictCache(pattern);
        return ResponseEntity.ok(response);
    }
}

