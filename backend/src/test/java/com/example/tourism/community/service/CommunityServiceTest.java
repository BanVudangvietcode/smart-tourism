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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommunityService Unit Tests")
class CommunityServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private PoiRepository poiRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommunityService communityService;

    private Poi samplePoi;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        samplePoi = new Poi();
        samplePoi.setId(1L);
        samplePoi.setName("Quán Ốc Oanh");
        samplePoi.setSlug("quan-oc-oanh");
        samplePoi.setLatitude(10.7612);
        samplePoi.setLongitude(106.7025);
        samplePoi.setCategoryId(1L);
        samplePoi.setPoiType("FOOD");
        samplePoi.setAvgRating(BigDecimal.valueOf(4.6));
        samplePoi.setReviewCount(320);

        sampleUser = new User();
        sampleUser.setId(10L);
        sampleUser.setDisplayName("Hoàng Vũ");
        sampleUser.setAvatarUrl("https://example.com/avatar.jpg");
    }

    @Test
    @DisplayName("createReview should save review, update POI rating stats, and return response")
    void createReview_success() {
        CreateReviewRequest req = new CreateReviewRequest(5, "Ốc hương sốt trứng muối rất ngon!", List.of("img1.jpg"));
        ReviewResponse expectedRes = new ReviewResponse(
                100L, 1L, 10L, "Hoàng Vũ", "https://example.com/avatar.jpg",
                5, "Ốc hương sốt trứng muối rất ngon!", List.of("img1.jpg"), LocalDateTime.now()
        );

        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.save(any(Review.class), eq("Hoàng Vũ"), eq("https://example.com/avatar.jpg"))).thenReturn(expectedRes);

        ReviewResponse res = communityService.createReview(1L, 10L, req);

        assertNotNull(res);
        assertEquals(5, res.rating());
        assertEquals("Ốc hương sốt trứng muối rất ngon!", res.comment());
        assertEquals("Hoàng Vũ", res.userDisplayName());
        verify(reviewRepository, times(1)).updatePoiRatingStats(1L);
    }

    @Test
    @DisplayName("createReview should throw ResourceNotFoundException when POI does not exist")
    void createReview_poiNotFound() {
        CreateReviewRequest req = new CreateReviewRequest(5, "Bình luận", null);
        when(poiRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                communityService.createReview(999L, 10L, req)
        );
    }

    @Test
    @DisplayName("getReviews should return paginated review list response")
    void getReviews_success() {
        ReviewResponse r1 = new ReviewResponse(
                1L, 1L, 10L, "Hoàng Vũ", null, 5, "Ngon", List.of(), LocalDateTime.now()
        );
        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));
        when(reviewRepository.findByPoiId(1L, 0, 10, "newest")).thenReturn(List.of(r1));
        when(reviewRepository.countByPoiId(1L)).thenReturn(1L);
        when(reviewRepository.getPoiAvgRating(1L)).thenReturn(4.8);
        when(reviewRepository.getPoiReviewCount(1L)).thenReturn(1);

        ReviewListResponse res = communityService.getReviews(1L, 0, 10, "newest");

        assertNotNull(res);
        assertEquals(1, res.totalCount());
        assertEquals(1, res.items().size());
        assertEquals(4.8, res.avgRating());
    }

    @Test
    @DisplayName("addFavorite should call repository and return FavoriteResponse(isFavorite=true)")
    void addFavorite_success() {
        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));

        FavoriteResponse res = communityService.addFavorite(1L, 10L);

        assertNotNull(res);
        assertTrue(res.isFavorite());
        assertEquals(1L, res.poiId());
        verify(favoriteRepository, times(1)).addFavorite(10L, 1L);
    }

    @Test
    @DisplayName("removeFavorite should call repository and return FavoriteResponse(isFavorite=false)")
    void removeFavorite_success() {
        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));

        FavoriteResponse res = communityService.removeFavorite(1L, 10L);

        assertNotNull(res);
        assertFalse(res.isFavorite());
        verify(favoriteRepository, times(1)).removeFavorite(10L, 1L);
    }

    @Test
    @DisplayName("getUserFavorites should return user favorite POIs")
    void getUserFavorites_success() {
        UserFavoritePoiResponse fav = new UserFavoritePoiResponse(
                1L, "Quán Ốc Oanh", "quan-oc-oanh", "FOOD", "Ốc & Hải sản",
                "534 Vĩnh Khánh", "thumb.jpg", 4.6, 320, 10.7612, 106.7025, LocalDateTime.now()
        );
        when(favoriteRepository.findFavoritesByUserId(10L)).thenReturn(List.of(fav));

        List<UserFavoritePoiResponse> results = communityService.getUserFavorites(10L);

        assertEquals(1, results.size());
        assertEquals("Quán Ốc Oanh", results.get(0).name());
    }

    @Test
    @DisplayName("checkin within 30m should verify checkin and unlock badges")
    void checkin_within30m_success() {
        // Tọa độ rất gần (cách ~11m)
        CheckinRequest req = new CheckinRequest(10.76125, 106.70255);

        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));
        when(checkinRepository.countByUserId(10L)).thenReturn(1L);
        when(badgeRepository.hasBadge(10L, "FIRST_CHECKIN")).thenReturn(false);
        when(badgeRepository.hasBadge(10L, "FOODIE_OC")).thenReturn(false);

        BadgeResponse b1 = new BadgeResponse("FIRST_CHECKIN", "Bước Chân Đầu Tiên", "Mô tả", "icon.png", LocalDateTime.now());
        BadgeResponse b2 = new BadgeResponse("FOODIE_OC", "Thổ Địa Phố Ốc", "Mô tả", "icon2.png", LocalDateTime.now());
        when(badgeRepository.unlockBadge(eq(10L), eq("FIRST_CHECKIN"), any(), any(), any())).thenReturn(b1);
        when(badgeRepository.unlockBadge(eq(10L), eq("FOODIE_OC"), any(), any(), any())).thenReturn(b2);

        CheckinResponse res = communityService.checkin(1L, 10L, req);

        assertTrue(res.success());
        assertTrue(res.verified());
        assertTrue(res.distanceMeters() <= 30.0);
        assertEquals(2, res.newlyUnlockedBadges().size());
        verify(checkinRepository, times(1)).save(any(Checkin.class));
    }

    @Test
    @DisplayName("checkin beyond 30m should fail verification and not save checkin")
    void checkin_beyond30m_fails() {
        // Tọa độ xa ~500m
        CheckinRequest req = new CheckinRequest(10.7650, 106.7050);

        when(poiRepository.findById(1L)).thenReturn(Optional.of(samplePoi));

        CheckinResponse res = communityService.checkin(1L, 10L, req);

        assertFalse(res.success());
        assertFalse(res.verified());
        assertTrue(res.distanceMeters() > 30.0);
        assertTrue(res.message().contains("Check-in thất bại"));
        verify(checkinRepository, never()).save(any(Checkin.class));
    }
}

