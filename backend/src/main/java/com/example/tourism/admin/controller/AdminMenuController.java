package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.*;
import com.example.tourism.admin.service.AdminMenuService;
import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminMenuController {

    private final AdminMenuService adminMenuService;

    public AdminMenuController(AdminMenuService adminMenuService) {
        this.adminMenuService = adminMenuService;
    }

    private void requireAdmin(AuthUser user) {
        if (user == null || !user.isAdmin()) {
            throw new SecurityException("Yêu cầu quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này.");
        }
    }

    /**
     * POST /api/v1/admin/pois/{poiId}/menu/scan-ocr
     * Body (Multipart): file (Ảnh chụp menu vỉa hè).
     * Ý nghĩa: Admin upload ảnh menu -> Backend gọi Gemini Flash đọc chữ, suy luận nguyên liệu & dị ứng -> Trả về JSON Draft.
     */
    @PostMapping(value = "/pois/{poiId}/menu/scan-ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrMenuDraftResponse> scanMenuOcr(
            @CurrentUser AuthUser user,
            @PathVariable Long poiId,
            @RequestParam("file") MultipartFile file) {

        requireAdmin(user);
        OcrMenuDraftResponse response = adminMenuService.scanMenuOcr(poiId, file);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/admin/pois/{poiId}/dishes
     * Body: { name, categoryName, price, isSignature, description, allergens, imageUrl }
     * Ý nghĩa: Admin thêm thủ công một món ăn mới vào quán.
     */
    @PostMapping("/pois/{poiId}/dishes")
    public ResponseEntity<AdminDishResponse> createDish(
            @CurrentUser AuthUser user,
            @PathVariable Long poiId,
            @Valid @RequestBody CreateAdminDishRequest request) {

        requireAdmin(user);
        AdminDishResponse response = adminMenuService.createDish(poiId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/v1/admin/dishes/{dishId}
     * Body: Các trường cần cập nhật (price, isAvailable, allergens, ...).
     * Ý nghĩa: Admin sửa chi tiết thông tin món ăn hoặc ẩn món khi hết hàng.
     */
    @PutMapping("/dishes/{dishId}")
    public ResponseEntity<AdminDishResponse> updateDish(
            @CurrentUser AuthUser user,
            @PathVariable Long dishId,
            @Valid @RequestBody UpdateAdminDishRequest request) {

        requireAdmin(user);
        AdminDishResponse response = adminMenuService.updateDish(dishId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/admin/dishes/{dishId}
     * Ý nghĩa: Admin xóa một món ra khỏi thực đơn.
     */
    @DeleteMapping("/dishes/{dishId}")
    public ResponseEntity<Map<String, Object>> deleteDish(
            @CurrentUser AuthUser user,
            @PathVariable Long dishId) {

        requireAdmin(user);
        adminMenuService.deleteDish(dishId);
        return ResponseEntity.ok(Map.of(
                "message", "Xóa món ăn thành công khỏi thực đơn.",
                "dishId", dishId
        ));
    }

    /**
     * POST /api/v1/admin/pois/{poiId}/menu/batch-import
     * Body (Multipart): File .xlsx / .csv.
     * Ý nghĩa: Admin upload file Excel để chèn hàng loạt (Batch Insert) cả menu vào database.
     */
    @PostMapping(value = "/pois/{poiId}/menu/batch-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BatchImportResponse> batchImportMenu(
            @CurrentUser AuthUser user,
            @PathVariable Long poiId,
            @RequestParam("file") MultipartFile file) {

        requireAdmin(user);
        BatchImportResponse response = adminMenuService.batchImportMenu(poiId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

