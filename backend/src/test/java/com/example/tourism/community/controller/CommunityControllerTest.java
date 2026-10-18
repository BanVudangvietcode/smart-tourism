package com.example.tourism.community.controller;

import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.auth.resolver.CurrentUserArgumentResolver;
import com.example.tourism.auth.util.JwtUtils;
import com.example.tourism.common.exception.GlobalExceptionHandler;
import com.example.tourism.community.dto.*;
import com.example.tourism.community.service.CommunityService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommunityController Unit Tests")
class CommunityControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private CommunityService communityService;

    @InjectMocks
    private CommunityController communityController;

    @BeforeEach
    void setUp() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(jwtUtils);

        mockMvc = MockMvcBuilders.standaloneSetup(communityController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    @DisplayName("POST /api/v1/pois/{poiId}/reviews: should return 201 Created on valid review")
    void createReview_success() throws Exception {
        CreateReviewRequest req = new CreateReviewRequest(5, "Ốc rất ngon và tươi!", List.of("img1.jpg"));
        ReviewResponse res = new ReviewResponse(
                1L, 1L, 10L, "Hoàng Vũ", null, 5, "Ốc rất ngon và tươi!", List.of("img1.jpg"), LocalDateTime.now()
        );

        when(communityService.createReview(eq(1L), eq(10L), any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/pois/{poiId}/reviews", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Ốc rất ngon và tươi!"))
                .andExpect(jsonPath("$.userDisplayName").value("Hoàng Vũ"));
    }

    @Test
    @DisplayName("POST /api/v1/pois/{poiId}/reviews: should return 400 Bad Request on invalid rating")
    void createReview_invalidRating_returns400() throws Exception {
        // rating = 6 (vượt quá 5 sao)
        CreateReviewRequest req = new CreateReviewRequest(6, "Bình luận", List.of());

        mockMvc.perform(post("/api/v1/pois/{poiId}/reviews", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Điểm đánh giá tối đa là 5 sao."));
    }

    @Test
    @DisplayName("GET /api/v1/pois/{poiId}/reviews: should return 200 OK with paginated reviews")
    void getReviews_success() throws Exception {
        ReviewResponse r1 = new ReviewResponse(
                1L, 1L, 10L, "Hoàng Vũ", null, 5, "Ngon", List.of(), LocalDateTime.now()
        );
        ReviewListResponse res = new ReviewListResponse(List.of(r1), 1L, 0, 10, 1, 5.0, 1);

        when(communityService.getReviews(eq(1L), eq(0), eq(10), eq("newest"))).thenReturn(res);

        mockMvc.perform(get("/api/v1/pois/{poiId}/reviews", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(1))
                .andExpect(jsonPath("$.items[0].id").value(1))
                .andExpect(jsonPath("$.avgRating").value(5.0));
    }

    @Test
    @DisplayName("POST /api/v1/pois/{poiId}/favorite: should return 200 OK")
    void addFavorite_success() throws Exception {
        FavoriteResponse res = new FavoriteResponse(1L, true, "Đã lưu vào danh sách yêu thích.");
        when(communityService.addFavorite(eq(1L), eq(10L))).thenReturn(res);

        mockMvc.perform(post("/api/v1/pois/{poiId}/favorite", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(1))
                .andExpect(jsonPath("$.isFavorite").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/pois/{poiId}/favorite: should return 200 OK")
    void removeFavorite_success() throws Exception {
        FavoriteResponse res = new FavoriteResponse(1L, false, "Đã xóa khỏi danh sách yêu thích.");
        when(communityService.removeFavorite(eq(1L), eq(10L))).thenReturn(res);

        mockMvc.perform(delete("/api/v1/pois/{poiId}/favorite", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(1))
                .andExpect(jsonPath("$.isFavorite").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/favorites: should return 200 OK with favorite POIs")
    void getMyFavorites_success() throws Exception {
        UserFavoritePoiResponse fav = new UserFavoritePoiResponse(
                1L, "Quán Ốc Oanh", "quan-oc-oanh", "FOOD", "Ốc & Hải sản",
                "534 Vĩnh Khánh", "thumb.jpg", 4.6, 320, 10.7612, 106.7025, LocalDateTime.now()
        );
        when(communityService.getUserFavorites(10L)).thenReturn(List.of(fav));

        mockMvc.perform(get("/api/v1/users/me/favorites")
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].poiId").value(1))
                .andExpect(jsonPath("$[0].name").value("Quán Ốc Oanh"));
    }

    @Test
    @DisplayName("POST /api/v1/pois/{poiId}/checkin: should return 200 OK when verified within 30m")
    void checkin_verified_returns200() throws Exception {
        CheckinRequest req = new CheckinRequest(10.76125, 106.70252);
        BadgeResponse badge = new BadgeResponse("FIRST_CHECKIN", "Bước Chân Đầu Tiên", "Mô tả", "icon.png", LocalDateTime.now());
        CheckinResponse res = new CheckinResponse(
                true, 1L, "Quán Ốc Oanh", 6.2, true, "Check-in thành công!", LocalDateTime.now(), List.of(badge)
        );

        when(communityService.checkin(eq(1L), eq(10L), any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/pois/{poiId}/checkin", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.distanceMeters").value(6.2))
                .andExpect(jsonPath("$.newlyUnlockedBadges[0].badgeCode").value("FIRST_CHECKIN"));
    }

    @Test
    @DisplayName("POST /api/v1/pois/{poiId}/checkin: should return 400 Bad Request when distance > 30m")
    void checkin_tooFar_returns400() throws Exception {
        CheckinRequest req = new CheckinRequest(10.7690, 106.7100);
        CheckinResponse res = new CheckinResponse(
                false, 1L, "Quán Ốc Oanh", 950.0, false, "Check-in thất bại: Bạn đang cách 950m", null, List.of()
        );

        when(communityService.checkin(eq(1L), eq(10L), any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/pois/{poiId}/checkin", 1L)
                        .requestAttr("userId", 10L)
                        .requestAttr("role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.verified").value(false))
                .andExpect(jsonPath("$.distanceMeters").value(950.0))
                .andExpect(jsonPath("$.message").value("Check-in thất bại: Bạn đang cách 950m"));
    }
}
