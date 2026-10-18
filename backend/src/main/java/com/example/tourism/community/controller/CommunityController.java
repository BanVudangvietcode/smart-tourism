package com.example.tourism.community.controller;

import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.community.dto.*;
import com.example.tourism.community.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    /**
     * POST /api/v1/pois/{poiId}/reviews
     * Gửi bình luận và chấm điểm kèm ảnh cho địa điểm.
     */
    @PostMapping("/pois/{poiId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long poiId,
            @Valid @RequestBody CreateReviewRequest request,
            @CurrentUser(required = true) AuthUser authUser) {

        ReviewResponse response = communityService.createReview(poiId, authUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/pois/{poiId}/reviews
     * Xem danh sách đánh giá có phân trang (page, size, sort).
     * Sắp xếp hỗ trợ: 'newest' (mới nhất), 'highest_rating' (điểm cao nhất), 'lowest_rating' (điểm thấp nhất).
     */
    @GetMapping("/pois/{poiId}/reviews")
    public ResponseEntity<ReviewListResponse> getReviews(
            @PathVariable Long poiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        ReviewListResponse response = communityService.getReviews(poiId, page, size, sort);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/pois/{poiId}/favorite
     * Lưu quán vào danh sách "Muốn thử" / Yêu thích của cá nhân.
     */
    @PostMapping("/pois/{poiId}/favorite")
    public ResponseEntity<FavoriteResponse> addFavorite(
            @PathVariable Long poiId,
            @CurrentUser(required = true) AuthUser authUser) {

        FavoriteResponse response = communityService.addFavorite(poiId, authUser.id());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/pois/{poiId}/favorite
     * Bỏ lưu quán khỏi danh sách yêu thích.
     */
    @DeleteMapping("/pois/{poiId}/favorite")
    public ResponseEntity<FavoriteResponse> removeFavorite(
            @PathVariable Long poiId,
            @CurrentUser(required = true) AuthUser authUser) {

        FavoriteResponse response = communityService.removeFavorite(poiId, authUser.id());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/users/me/favorites
     * Trả về danh sách các ghim quán ăn/địa điểm yêu thích của cá nhân trên bản đồ.
     */
    @GetMapping("/users/me/favorites")
    public ResponseEntity<List<UserFavoritePoiResponse>> getMyFavorites(
            @CurrentUser(required = true) AuthUser authUser) {

        List<UserFavoritePoiResponse> favorites = communityService.getUserFavorites(authUser.id());
        return ResponseEntity.ok(favorites);
    }

    /**
     * POST /api/v1/pois/{poiId}/checkin
     * Body: { userLat, userLng }
     * Kiểm tra cự ly GPS 30m để xác thực du khách đã ghé quán và cấp huy hiệu thành tích.
     */
    @PostMapping("/pois/{poiId}/checkin")
    public ResponseEntity<CheckinResponse> checkin(
            @PathVariable Long poiId,
            @Valid @RequestBody CheckinRequest request,
            @CurrentUser(required = true) AuthUser authUser) {

        CheckinResponse response = communityService.checkin(poiId, authUser.id(), request);
        HttpStatus status = response.verified() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }
}

