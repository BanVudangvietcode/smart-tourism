package com.example.tourism.community.service;

import com.example.tourism.common.exception.ResourceNotFoundException;
import com.example.tourism.community.dto.*;
import com.example.tourism.community.model.Checkin;
import com.example.tourism.community.model.Review;
import com.example.tourism.community.repository.BadgeRepository;
import com.example.tourism.community.repository.CheckinRepository;
import com.example.tourism.community.repository.FavoriteRepository;
import com.example.tourism.community.repository.ReviewRepository;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.repository.PoiRepository;
import com.example.tourism.user.model.User;
import com.example.tourism.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CommunityService {

    public static final double CHECKIN_MAX_DISTANCE_METERS = 30.0;

    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;
    private final CheckinRepository checkinRepository;
    private final BadgeRepository badgeRepository;
    private final PoiRepository poiRepository;
    private final UserRepository userRepository;

    public CommunityService(ReviewRepository reviewRepository,
                            FavoriteRepository favoriteRepository,
                            CheckinRepository checkinRepository,
                            BadgeRepository badgeRepository,
                            PoiRepository poiRepository,
                            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.favoriteRepository = favoriteRepository;
        this.checkinRepository = checkinRepository;
        this.badgeRepository = badgeRepository;
        this.poiRepository = poiRepository;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/v1/pois/{poiId}/reviews
     * Gửi bình luận / chấm điểm kèm ảnh và tự động cập nhật avg_rating, review_count của POI.
     */
    @Transactional
    public ReviewResponse createReview(Long poiId, Long userId, CreateReviewRequest request) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm", poiId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        String displayName = user.getDisplayName() != null && !user.getDisplayName().isBlank()
                ? user.getDisplayName()
                : "Du khách ẩm thực";
        String avatarUrl = user.getAvatarUrl();

        Review review = new Review();
        review.setPoiId(poiId);
        review.setUserId(userId);
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setImages(request.images() != null ? request.images() : List.of());

        ReviewResponse response = reviewRepository.save(review, displayName, avatarUrl);

        // Tự động tính toán lại và cập nhật điểm đánh giá trung bình & số lượng review của POI
        reviewRepository.updatePoiRatingStats(poiId);

        return response;
    }

    /**
     * GET /api/v1/pois/{poiId}/reviews
     * Lấy danh sách đánh giá có phân trang (page, size, sort).
     */
    public ReviewListResponse getReviews(Long poiId, int page, int size, String sort) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm", poiId));

        int safePage = Math.max(0, page);
        int safeSize = (size <= 0 || size > 100) ? 10 : size;
        int offset = safePage * safeSize;

        List<ReviewResponse> items = reviewRepository.findByPoiId(poiId, offset, safeSize, sort);
        long totalCount = reviewRepository.countByPoiId(poiId);
        int totalPages = (int) Math.ceil((double) totalCount / safeSize);

        Double avgRating = reviewRepository.getPoiAvgRating(poiId);
        Integer reviewCount = reviewRepository.getPoiReviewCount(poiId);

        return new ReviewListResponse(
                items,
                totalCount,
                safePage,
                safeSize,
                totalPages,
                avgRating != null ? avgRating : (poi.getAvgRating() != null ? poi.getAvgRating().doubleValue() : 0.0),
                reviewCount != null ? reviewCount : poi.getReviewCount()
        );
    }

    /**
     * POST /api/v1/pois/{poiId}/favorite
     * Lưu địa điểm vào danh sách Yêu thích / "Muốn thử".
     */
    public FavoriteResponse addFavorite(Long poiId, Long userId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm", poiId));

        favoriteRepository.addFavorite(userId, poiId);
        return new FavoriteResponse(poiId, true, "Đã lưu " + poi.getName() + " vào danh sách yêu thích.");
    }

    /**
     * DELETE /api/v1/pois/{poiId}/favorite
     * Bỏ lưu địa điểm khỏi danh sách Yêu thích.
     */
    public FavoriteResponse removeFavorite(Long poiId, Long userId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm", poiId));

        favoriteRepository.removeFavorite(userId, poiId);
        return new FavoriteResponse(poiId, false, "Đã xóa " + poi.getName() + " khỏi danh sách yêu thích.");
    }

    /**
     * GET /api/v1/users/me/favorites
     * Trả về danh sách các địa điểm yêu thích của cá nhân để hiển thị trên bản đồ.
     */
    public List<UserFavoritePoiResponse> getUserFavorites(Long userId) {
        return favoriteRepository.findFavoritesByUserId(userId);
    }

    /**
     * POST /api/v1/pois/{poiId}/checkin
     * Xác thực GPS 30m để ghi nhận check-in thực tế và cấp huy hiệu thành tích.
     */
    @Transactional
    public CheckinResponse checkin(Long poiId, Long userId, CheckinRequest request) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm", poiId));

        double poiLat = poi.getLatitude();
        double poiLng = poi.getLongitude();

        double distanceMeters = calculateHaversineDistance(request.userLat(), request.userLng(), poiLat, poiLng);
        boolean isVerified = distanceMeters <= CHECKIN_MAX_DISTANCE_METERS;

        if (!isVerified) {
            String message = String.format(
                    "Check-in thất bại: Bạn đang cách %s %.1fm (yêu cầu trong cự ly %.0fm để xác thực).",
                    poi.getName(), distanceMeters, CHECKIN_MAX_DISTANCE_METERS
            );
            return new CheckinResponse(
                    false,
                    poiId,
                    poi.getName(),
                    distanceMeters,
                    false,
                    message,
                    null,
                    List.of()
            );
        }

        // Lưu lượt check-in đã xác thực
        Checkin checkin = new Checkin();
        checkin.setUserId(userId);
        checkin.setPoiId(poiId);
        checkin.setCheckinLat(request.userLat());
        checkin.setCheckinLng(request.userLng());
        checkin.setDistanceMeters(distanceMeters);
        checkin.setVerified(true);
        checkinRepository.save(checkin);

        // Đánh giá cấp huy hiệu thành tích (Gamification Badges)
        List<BadgeResponse> unlockedBadges = evaluateAndAwardBadges(userId, poi);

        String message = String.format(
                "Check-in thành công tại %s (khoảng cách %.1fm)! Bạn đã xác thực mặt tại địa điểm.",
                poi.getName(), distanceMeters
        );

        return new CheckinResponse(
                true,
                poiId,
                poi.getName(),
                distanceMeters,
                true,
                message,
                LocalDateTime.now(),
                unlockedBadges
        );
    }

    private List<BadgeResponse> evaluateAndAwardBadges(Long userId, Poi poi) {
        List<BadgeResponse> unlocked = new ArrayList<>();
        long totalCheckins = checkinRepository.countByUserId(userId);

        // 1. Huy hiệu "Bước Chân Đầu Tiên"
        if (!badgeRepository.hasBadge(userId, "FIRST_CHECKIN")) {
            BadgeResponse b = badgeRepository.unlockBadge(
                    userId,
                    "FIRST_CHECKIN",
                    "Bước Chân Đầu Tiên",
                    "Thực hiện lượt check-in đầu tiên tại Quận 4",
                    "https://cdn-icons-png.flaticon.com/512/3176/3176366.png"
            );
            unlocked.add(b);
        }

        // 2. Huy hiệu "Thổ Địa Phố Ốc"
        if (poi.getCategoryId() != null && poi.getCategoryId() == 1L && !badgeRepository.hasBadge(userId, "FOODIE_OC")) {
            BadgeResponse b = badgeRepository.unlockBadge(
                    userId,
                    "FOODIE_OC",
                    "Thổ Địa Phố Ốc",
                    "Khám phá và check-in các điểm ẩm thực ốc trứ danh Quận 4",
                    "https://cdn-icons-png.flaticon.com/512/2921/2921822.png"
            );
            unlocked.add(b);
        }

        // 3. Huy hiệu "Nhà Thám Hiểm Lịch Sử"
        boolean isHistorical = (poi.getCategoryId() != null && poi.getCategoryId() == 6L)
                || "HISTORICAL".equalsIgnoreCase(poi.getPoiType());
        if (isHistorical && !badgeRepository.hasBadge(userId, "HISTORIAN")) {
            BadgeResponse b = badgeRepository.unlockBadge(
                    userId,
                    "HISTORIAN",
                    "Nhà Thám Hiểm Lịch Sử",
                    "Ghé thăm và check-in các di tích lịch sử - văn hóa hào hùng của Quận 4",
                    "https://cdn-icons-png.flaticon.com/512/2234/2234674.png"
            );
            unlocked.add(b);
        }

        // 4. Huy hiệu "Dấu Ấn Tâm Linh"
        boolean isReligious = (poi.getCategoryId() != null && poi.getCategoryId() == 7L)
                || "RELIGIOUS".equalsIgnoreCase(poi.getPoiType());
        if (isReligious && !badgeRepository.hasBadge(userId, "PILGRIM")) {
            BadgeResponse b = badgeRepository.unlockBadge(
                    userId,
                    "PILGRIM",
                    "Dấu Ấn Tâm Linh",
                    "Chiêm bái các ngôi chùa cổ và thánh đường lịch sử Quận 4",
                    "https://cdn-icons-png.flaticon.com/512/2645/2645897.png"
            );
            unlocked.add(b);
        }

        // 5. Huy hiệu "Chuyên Gia Khám Phá Quận 4" (>= 3 địa điểm)
        if (totalCheckins >= 3 && !badgeRepository.hasBadge(userId, "DISTRICT_EXPLORER")) {
            BadgeResponse b = badgeRepository.unlockBadge(
                    userId,
                    "DISTRICT_EXPLORER",
                    "Chuyên Gia Khám Phá Quận 4",
                    "Tích lũy từ 3 lượt check-in thực tế trên khắp địa bàn Quận 4",
                    "https://cdn-icons-png.flaticon.com/512/854/854878.png"
            );
            unlocked.add(b);
        }

        return unlocked;
    }

    /**
     * Tính cự ly Haversine giữa 2 tọa độ GPS (trả về mét).
     */
    public static double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000.0; // Bán kính Trái Đất (mét)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }
}

