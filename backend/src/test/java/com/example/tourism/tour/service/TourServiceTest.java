package com.example.tourism.tour.service;

import com.example.tourism.dish.model.Dish;
import com.example.tourism.dish.repository.DishRepository;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.repository.PoiRepository;
import com.example.tourism.tour.dto.*;
import com.example.tourism.tour.model.Tour;
import com.example.tourism.tour.model.TourStop;
import com.example.tourism.tour.repository.TourRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TourServiceTest {

    private TourRepository tourRepository;
    private PoiRepository poiRepository;
    private DishRepository dishRepository;
    private TourService tourService;

    @BeforeEach
    void setUp() {
        tourRepository = mock(TourRepository.class);
        poiRepository = mock(PoiRepository.class);
        dishRepository = mock(DishRepository.class);
        tourService = new TourService(tourRepository, poiRepository, dishRepository);
    }

    private Poi createMockPoi(Long id, String name, String type, double lat, double lng, int minPrice) {
        Poi p = new Poi();
        p.setId(id);
        p.setName(name);
        p.setSlug("slug-" + id);
        p.setPoiType(type);
        p.setLatitude(lat);
        p.setLongitude(lng);
        p.setAddress("Địa chỉ " + id);
        p.setThumbnailUrl("https://example.com/thumb" + id + ".jpg");
        p.setPriceRangeMin(minPrice);
        p.setPriceRangeMax(minPrice * 2);
        p.setAvgRating(BigDecimal.valueOf(4.5));
        p.setReviewCount(100);
        return p;
    }

    private Tour createMockTour(Long id, String name, String slug, boolean isPublic, Long creatorId) {
        Tour t = new Tour();
        t.setId(id);
        t.setName(name);
        t.setSlug(slug);
        t.setDescription("Mô tả tour");
        t.setTheme("FOOD");
        t.setEstimatedDurationMinutes(90);
        t.setEstimatedCost(150000);
        t.setTotalDistanceMeters(1000);
        t.setThumbnailUrl("https://example.com/tour.jpg");
        t.setPublic(isPublic);
        t.setCreatorId(creatorId);
        t.setCreatorRole(creatorId == null ? "ADMIN" : "USER");
        t.setCreatorName("Người tạo");
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        return t;
    }

    @Test
    void getTours_returnsTourSummaryList() {
        Tour t1 = createMockTour(1L, "Foodtour Vĩnh Khánh", "foodtour-vinh-khanh", true, null);
        when(tourRepository.findTours(null, null, null, null)).thenReturn(List.of(t1));
        when(tourRepository.countStopsByTourId(1L)).thenReturn(2);

        List<TourSummaryResponse> results = tourService.getTours(null, null, null, null);

        assertEquals(1, results.size());
        assertEquals("Foodtour Vĩnh Khánh", results.get(0).name());
        assertEquals(2, results.get(0).stopCount());
        assertTrue(results.get(0).isPublic());
    }

    @Test
    void getTourByIdOrSlug_publicTour_returnsDetail() {
        Tour t = createMockTour(1L, "Foodtour Vĩnh Khánh", "foodtour-vinh-khanh", true, null);
        when(tourRepository.findById(1L)).thenReturn(Optional.of(t));

        TourStop stop = new TourStop();
        stop.setId(10L);
        stop.setTourId(1L);
        stop.setPoiId(1L);
        stop.setStopOrder(1);
        stop.setEstimatedDurationMinutes(45);
        stop.setRecommendedDishOrActivity("Ốc hương trứng muối");
        stop.setNote("Ghé sớm");

        when(tourRepository.findStopsByTourId(1L)).thenReturn(List.of(stop));
        Poi poi = createMockPoi(1L, "Quán Ốc Oanh", "FOOD", 10.7612, 106.7025, 50000);
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));

        TourDetailResponse detail = tourService.getTourByIdOrSlug("1", null);

        assertNotNull(detail);
        assertEquals(1L, detail.id());
        assertEquals(1, detail.stops().size());
        assertEquals("Ốc hương trứng muối", detail.stops().get(0).recommendedDishOrActivity());
        assertEquals("Quán Ốc Oanh", detail.stops().get(0).poi().name());
    }

    @Test
    void getTourByIdOrSlug_privateTour_nonOwnerThrowsSecurityException() {
        Tour t = createMockTour(2L, "Tour Riêng Tư", "tour-rieng-tu", false, 99L);
        when(tourRepository.findById(2L)).thenReturn(Optional.of(t));

        // Requester is not owner (user 100 != 99)
        assertThrows(SecurityException.class, () -> tourService.getTourByIdOrSlug("2", 100L));
    }

    @Test
    void getTourByIdOrSlug_privateTour_ownerAllowed() {
        Tour t = createMockTour(2L, "Tour Riêng Tư", "tour-rieng-tu", false, 99L);
        when(tourRepository.findById(2L)).thenReturn(Optional.of(t));
        when(tourRepository.findStopsByTourId(2L)).thenReturn(List.of());

        TourDetailResponse detail = tourService.getTourByIdOrSlug("2", 99L);
        assertNotNull(detail);
        assertFalse(detail.isPublic());
        assertEquals(99L, detail.creatorId());
    }

    @Test
    void createTour_calculatesMetricsAndPersists() {
        Poi poi1 = createMockPoi(1L, "Quán Ốc Oanh", "FOOD", 10.7612, 106.7025, 50000);
        Poi poi2 = createMockPoi(2L, "Phá Lấu Cô Thảo", "FOOD", 10.7588, 106.7042, 35000);
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi1));
        when(poiRepository.findById(2L)).thenReturn(Optional.of(poi2));

        when(tourRepository.existsBySlug(anyString())).thenReturn(false);
        when(tourRepository.saveTour(any(Tour.class))).thenReturn(101L);
        when(tourRepository.saveTourStop(any(TourStop.class))).thenReturn(1L, 2L);

        CreateTourStopRequest s1 = new CreateTourStopRequest(1L, 1, 40, null, "Ăn ốc");
        CreateTourStopRequest s2 = new CreateTourStopRequest(2L, 2, 30, null, "Ăn phá lấu");
        CreateTourRequest req = new CreateTourRequest(
                "Tour Thử Nghiệm", "Mô tả", null, null, null, null, null, true, "Hoàng Vũ", List.of(s1, s2)
        );

        TourDetailResponse res = tourService.createTour(req, 1L, "USER");

        assertNotNull(res);
        assertEquals(101L, res.id());
        assertEquals("FOOD", res.theme());
        assertTrue(res.estimatedCost() >= 85000);
        assertTrue(res.estimatedDurationMinutes() >= 70);
        assertEquals(2, res.stops().size());
        verify(tourRepository, times(1)).saveTour(any(Tour.class));
        verify(tourRepository, times(2)).saveTourStop(any(TourStop.class));
    }

    @Test
    void generateCustomPlan_optimizesItineraryWithinBudgetAndTime() {
        Poi poi1 = createMockPoi(1L, "Quán Ốc Oanh", "FOOD", 10.7612, 106.7025, 50000);
        Poi poi2 = createMockPoi(3L, "Bến Nhà Rồng", "HISTORICAL", 10.7682, 106.7068, 30000);
        Poi poi3 = createMockPoi(5L, "Cầu Mống", "LANDMARK", 10.7695, 106.7037, 0);

        when(poiRepository.findCandidates(any(), any())).thenReturn(List.of(poi1, poi2, poi3));

        Dish dish = new Dish();
        dish.setName("Ốc hương xào bơ");
        dish.setSignature(true);
        when(dishRepository.findDishesByPoiId(1L)).thenReturn(List.of(dish));

        CustomPlanRequest req = new CustomPlanRequest(
                90, 10.7610, 106.7020, List.of(1L, 6L), List.of("FOOD", "HISTORICAL"),
                200000, false, null, null
        );

        CustomPlanResponse plan = tourService.generateCustomPlan(req, null, null);

        assertNotNull(plan);
        assertEquals(90, plan.availableMinutes());
        assertTrue(plan.totalDurationMinutes() <= 90);
        assertTrue(plan.stopCount() >= 1);
        assertNotNull(plan.stops().get(0).poi());
        assertNotNull(plan.stops().get(0).recommendedDishOrActivity());
    }
}
