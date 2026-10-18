package com.example.tourism.admin.controller;

import com.example.tourism.admin.dto.AdminPoiResponse;
import com.example.tourism.admin.dto.CreateAdminPoiRequest;
import com.example.tourism.admin.dto.UpdateAdminPoiRequest;
import com.example.tourism.admin.service.AdminPoiService;
import com.example.tourism.audio.dto.AudioCreateResponse;
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
@RequestMapping("/api/v1/admin/pois")
public class AdminPoiController {

    private final AdminPoiService adminPoiService;

    public AdminPoiController(AdminPoiService adminPoiService) {
        this.adminPoiService = adminPoiService;
    }

    private void requireAdmin(AuthUser user) {
        if (user == null || !user.isAdmin()) {
            throw new SecurityException("Yêu cầu quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này.");
        }
    }

    /**
     * POST /api/v1/admin/pois
     * Body (Multipart): Thông tin text + Ảnh đại diện + File MP3 thuyết minh.
     * Ý nghĩa: Tạo quán mới, tự động tính tọa độ PostGIS Point.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminPoiResponse> createPoi(
            @CurrentUser AuthUser user,
            @RequestParam("name") String name,
            @RequestParam(value = "slug", required = false) String slug,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "district", defaultValue = "Quận 4") String district,
            @RequestParam(value = "ward", required = false) String ward,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "openingHours", required = false) String openingHours,
            @RequestParam(value = "priceRangeMin", required = false) Integer priceRangeMin,
            @RequestParam(value = "priceRangeMax", required = false) Integer priceRangeMax,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "poiType", defaultValue = "FOOD") String poiType,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "thumbnailUrl", required = false) String thumbnailUrl,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "audioScript", required = false) String audioScript,
            @RequestParam(value = "audioTitle", required = false) String audioTitle) {

        requireAdmin(user);

        CreateAdminPoiRequest req = new CreateAdminPoiRequest(
                name, slug, description, address, district, ward, phone,
                openingHours, priceRangeMin, priceRangeMax, categoryId, poiType,
                latitude, longitude, thumbnailUrl
        );

        AdminPoiResponse response = adminPoiService.createPoi(req, image, audio, audioScript, audioTitle);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/v1/admin/pois/{id}
     * Ý nghĩa: Cập nhật thông tin quán.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AdminPoiResponse> updatePoi(
            @CurrentUser AuthUser user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdminPoiRequest req) {

        requireAdmin(user);
        AdminPoiResponse response = adminPoiService.updatePoi(id, req);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/admin/pois/{id}
     * Ý nghĩa: Xóa mềm địa điểm quán ăn / di tích.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePoi(
            @CurrentUser AuthUser user,
            @PathVariable Long id) {

        requireAdmin(user);
        adminPoiService.softDeletePoi(id);
        return ResponseEntity.ok(Map.of(
                "message", "Xóa mềm địa điểm thành công.",
                "poiId", id,
                "active", false
        ));
    }

    /**
     * POST /api/v1/admin/pois/{id}/audio
     * Body (Multipart): File MP3 mới.
     * Ý nghĩa: Cập nhật file audio thuyết minh.
     */
    @PostMapping(value = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioCreateResponse> uploadPoiAudio(
            @CurrentUser AuthUser user,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "transcript", required = false) String transcript,
            @RequestParam(value = "voice", defaultValue = "Nữ miền Nam (Truyền cảm)") String voice) {

        requireAdmin(user);
        AudioCreateResponse response = adminPoiService.uploadPoiAudio(id, file, title, transcript, voice);
        return ResponseEntity.ok(response);
    }
}

