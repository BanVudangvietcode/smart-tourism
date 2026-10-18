package com.example.tourism.tour.service;

import com.example.tourism.dish.model.Dish;
import com.example.tourism.dish.repository.DishRepository;
import com.example.tourism.poi.dto.PoiSummaryResponse;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.repository.PoiRepository;
import com.example.tourism.tour.dto.*;
import com.example.tourism.tour.model.Tour;
import com.example.tourism.tour.model.TourStop;
import com.example.tourism.tour.repository.TourRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TourService {

    private static final Logger log = LoggerFactory.getLogger(TourService.class);

    private final TourRepository tourRepository;
    private final PoiRepository poiRepository;
    private final DishRepository dishRepository;

    public TourService(TourRepository tourRepository,
                       PoiRepository poiRepository,
                       DishRepository dishRepository) {
        this.tourRepository = tourRepository;
        this.poiRepository = poiRepository;
        this.dishRepository = dishRepository;
    }

    /**
     * Retrieve list of tours matching filters.
     * Supports public curated tours and user-owned private tours.
     */
    public List<TourSummaryResponse> getTours(String theme, Boolean isPublic, Long userId, String search) {
        List<Tour> tours = tourRepository.findTours(theme, isPublic, userId, search);
        return tours.stream().map(t -> {
            int stopCount = tourRepository.countStopsByTourId(t.getId());
            return new TourSummaryResponse(
                    t.getId(),
                    t.getName(),
                    t.getSlug(),
                    t.getDescription(),
                    t.getTheme(),
                    t.getEstimatedDurationMinutes(),
                    t.getEstimatedCost(),
                    t.getTotalDistanceMeters(),
                    t.getThumbnailUrl(),
                    stopCount,
                    t.isPublic(),
                    t.getCreatorId(),
                    t.getCreatorRole(),
                    t.getCreatorName(),
                    t.getCreatedAt()
            );
        }).toList();
    }

    /**
     * Retrieve complete tour details by ID or Slug.
     */
    public TourDetailResponse getTourByIdOrSlug(String idOrSlug, Long currentUserId) {
        Tour tour = null;
        try {
            Long id = Long.parseLong(idOrSlug);
            tour = tourRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (tour == null) {
            tour = tourRepository.findBySlug(idOrSlug)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tour với mã hoặc đường dẫn: " + idOrSlug));
        }

        // Privacy check
        if (!tour.isPublic()) {
            if (currentUserId == null || !currentUserId.equals(tour.getCreatorId())) {
                throw new SecurityException("Tour này được đặt ở chế độ riêng tư bởi người tạo.");
            }
        }

        List<TourStop> stops = tourRepository.findStopsByTourId(tour.getId());
        List<TourStopDetailResponse> stopResponses = new ArrayList<>();

        for (TourStop s : stops) {
            Poi poi = poiRepository.findById(s.getPoiId()).orElse(null);
            PoiSummaryResponse poiSummary = poi != null ? toPoiSummary(poi, null) : null;
            stopResponses.add(new TourStopDetailResponse(
                    s.getId(),
                    s.getStopOrder(),
                    s.getEstimatedDurationMinutes(),
                    s.getRecommendedDishOrActivity(),
                    s.getNote(),
                    poiSummary
            ));
        }

        return new TourDetailResponse(
                tour.getId(),
                tour.getName(),
                tour.getSlug(),
                tour.getDescription(),
                tour.getTheme(),
                tour.getEstimatedDurationMinutes(),
                tour.getEstimatedCost(),
                tour.getTotalDistanceMeters(),
                tour.getThumbnailUrl(),
                tour.isPublic(),
                tour.getCreatorId(),
                tour.getCreatorRole(),
                tour.getCreatorName(),
                tour.getCreatedAt(),
                tour.getUpdatedAt(),
                stopResponses
        );
    }

    /**
     * Create a new tour (Curated by Admin or Custom by User).
     */
    @Transactional
    public TourDetailResponse createTour(CreateTourRequest request, Long creatorId, String creatorRole) {
        if (request.stops() == null || request.stops().isEmpty()) {
            throw new IllegalArgumentException("Tour phải có ít nhất một điểm dừng.");
        }

        // Validate all POIs exist
        List<Poi> poiList = new ArrayList<>();
        for (CreateTourStopRequest s : request.stops()) {
            Poi poi = poiRepository.findById(s.poiId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa điểm POI ID: " + s.poiId()));
            poiList.add(poi);
        }

        // Generate unique slug
        String baseSlug = toSlug(request.name());
        String slug = baseSlug;
        int counter = 1;
        while (tourRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        // Calculate metrics if not provided
        int totalDuration = request.estimatedDurationMinutes() != null && request.estimatedDurationMinutes() > 0
                ? request.estimatedDurationMinutes()
                : calculateTotalDuration(request.stops(), poiList);

        int totalCost = request.estimatedCost() != null && request.estimatedCost() > 0
                ? request.estimatedCost()
                : calculateTotalCost(poiList);

        int totalDistance = request.totalDistanceMeters() != null && request.totalDistanceMeters() > 0
                ? request.totalDistanceMeters()
                : calculateTotalDistance(poiList);

        // Determine theme if null
        String theme = request.theme();
        if (theme == null || theme.isBlank()) {
            theme = deduceTheme(poiList);
        }

        // Thumbnail from first POI if not provided
        String thumbnailUrl = request.thumbnailUrl();
        if ((thumbnailUrl == null || thumbnailUrl.isBlank()) && !poiList.isEmpty()) {
            thumbnailUrl = poiList.get(0).getThumbnailUrl();
        }

        boolean isPublic = request.isPublic() == null || request.isPublic();
        String effectiveRole = creatorRole != null ? creatorRole : (creatorId != null ? "USER" : "ADMIN");
        String creatorName = request.creatorName() != null && !request.creatorName().isBlank()
                ? request.creatorName().trim()
                : ("ADMIN".equalsIgnoreCase(effectiveRole) ? "Hệ thống Smart Tourism" : "Du khách Quận 4");

        Tour tour = new Tour();
        tour.setName(request.name().trim());
        tour.setSlug(slug);
        tour.setDescription(request.description());
        tour.setTheme(theme.toUpperCase());
        tour.setEstimatedDurationMinutes(totalDuration);
        tour.setEstimatedCost(totalCost);
        tour.setTotalDistanceMeters(totalDistance);
        tour.setThumbnailUrl(thumbnailUrl);
        tour.setPublic(isPublic);
        tour.setCreatorId(creatorId);
        tour.setCreatorRole(effectiveRole);
        tour.setCreatorName(creatorName);

        Long tourId = tourRepository.saveTour(tour);
        tour.setId(tourId);

        List<TourStopDetailResponse> stopResponses = new ArrayList<>();
        int order = 1;
        for (int i = 0; i < request.stops().size(); i++) {
            CreateTourStopRequest stopReq = request.stops().get(i);
            Poi poi = poiList.get(i);

            int stopDuration = stopReq.estimatedDurationMinutes() != null && stopReq.estimatedDurationMinutes() > 0
                    ? stopReq.estimatedDurationMinutes()
                    : getDefaultDurationForPoi(poi);

            String dishOrAct = stopReq.recommendedDishOrActivity();
            if (dishOrAct == null || dishOrAct.isBlank()) {
                dishOrAct = generateRecommendation(poi);
            }

            TourStop stop = new TourStop();
            stop.setTourId(tourId);
            stop.setPoiId(stopReq.poiId());
            stop.setStopOrder(stopReq.stopOrder() != null ? stopReq.stopOrder() : order);
            stop.setEstimatedDurationMinutes(stopDuration);
            stop.setRecommendedDishOrActivity(dishOrAct);
            stop.setNote(stopReq.note());

            Long stopId = tourRepository.saveTourStop(stop);
            stop.setId(stopId);

            stopResponses.add(new TourStopDetailResponse(
                    stopId,
                    stop.getStopOrder(),
                    stopDuration,
                    dishOrAct,
                    stop.getNote(),
                    toPoiSummary(poi, null)
            ));
            order++;
        }

        return new TourDetailResponse(
                tour.getId(),
                tour.getName(),
                tour.getSlug(),
                tour.getDescription(),
                tour.getTheme(),
                tour.getEstimatedDurationMinutes(),
                tour.getEstimatedCost(),
                tour.getTotalDistanceMeters(),
                tour.getThumbnailUrl(),
                tour.isPublic(),
                tour.getCreatorId(),
                tour.getCreatorRole(),
                tour.getCreatorName(),
                tour.getCreatedAt(),
                tour.getUpdatedAt(),
                stopResponses
        );
    }

    /**
     * Automated custom tour planner based on user's available time budget,
     * starting geographic coordinates, category / POI type interests.
     */
    @Transactional
    public CustomPlanResponse generateCustomPlan(CustomPlanRequest request, Long currentUserId, String userRole) {
        int availableMinutes = request.availableMinutes();
        double startLat = request.startLat();
        double startLng = request.startLng();

        // 1. Fetch candidate POIs
        List<Poi> candidates = poiRepository.findCandidates(request.selectedCategories(), request.poiTypes());
        if (candidates.isEmpty()) {
            candidates = poiRepository.findAll();
        }

        // 2. Greedy Nearest Neighbor selection respecting available minutes & optional budget
        List<CustomPlanStopResponse> planStops = new ArrayList<>();
        Set<Long> visitedPoiIds = new HashSet<>();
        double currentLat = startLat;
        double currentLng = startLng;
        int timeSpent = 0;
        int totalDistance = 0;
        int totalCost = 0;
        int stopOrder = 1;

        while (true) {
            Poi bestCandidate = null;
            double minDistance = Double.MAX_VALUE;
            int bestTravelTime = 0;
            int bestVisitDuration = 0;
            int bestPoiCost = 0;

            for (Poi p : candidates) {
                if (visitedPoiIds.contains(p.getId())) continue;

                double dist = calculateDistanceMeters(currentLat, currentLng, p.getLatitude(), p.getLongitude());
                // Mixed travel speed: ~200 m/min in urban alleys, minimum 3 min
                int travelMinutes = (int) Math.max(3, Math.ceil(dist / 200.0));
                int visitDuration = getDefaultDurationForPoi(p);
                int poiCost = p.getPriceRangeMin() != null ? p.getPriceRangeMin() : 30000;

                // Check budget condition
                if (request.maxBudget() != null && (totalCost + poiCost > request.maxBudget())) {
                    continue;
                }

                // Check time feasibility
                if (timeSpent + travelMinutes + visitDuration <= availableMinutes) {
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestCandidate = p;
                        bestTravelTime = travelMinutes;
                        bestVisitDuration = visitDuration;
                        bestPoiCost = poiCost;
                    }
                }
            }

            if (bestCandidate == null) {
                // No more candidate POI fits within the remaining time
                break;
            }

            // Add selected POI
            visitedPoiIds.add(bestCandidate.getId());
            timeSpent += bestTravelTime + bestVisitDuration;
            totalDistance += (int) minDistance;
            totalCost += bestPoiCost;

            String dishOrAct = generateRecommendation(bestCandidate);
            String note = generateStopNote(bestCandidate, minDistance);

            planStops.add(new CustomPlanStopResponse(
                    stopOrder++,
                    toPoiSummary(bestCandidate, minDistance),
                    bestVisitDuration,
                    bestTravelTime,
                    minDistance,
                    dishOrAct,
                    note
            ));

            currentLat = bestCandidate.getLatitude();
            currentLng = bestCandidate.getLongitude();
        }

        // If no POI fit, but we have candidates, at least provide the single nearest POI with scaled visit duration
        if (planStops.isEmpty() && !candidates.isEmpty()) {
            Poi nearest = candidates.stream()
                    .min(Comparator.comparingDouble(p -> calculateDistanceMeters(startLat, startLng, p.getLatitude(), p.getLongitude())))
                    .orElse(candidates.get(0));

            double dist = calculateDistanceMeters(startLat, startLng, nearest.getLatitude(), nearest.getLongitude());
            int travelMinutes = (int) Math.max(2, Math.ceil(dist / 200.0));
            int visitDuration = Math.max(10, availableMinutes - travelMinutes);
            int poiCost = nearest.getPriceRangeMin() != null ? nearest.getPriceRangeMin() : 25000;

            timeSpent = travelMinutes + visitDuration;
            totalDistance = (int) dist;
            totalCost = poiCost;

            planStops.add(new CustomPlanStopResponse(
                    1,
                    toPoiSummary(nearest, dist),
                    visitDuration,
                    travelMinutes,
                    dist,
                    generateRecommendation(nearest),
                    "Điểm đến tối ưu cho quỹ thời gian ngắn (" + availableMinutes + " phút)"
            ));
        }

        int remainingMinutes = Math.max(0, availableMinutes - timeSpent);
        Long savedTourId = null;

        // 3. Optionally save as a reusable tour
        if (Boolean.TRUE.equals(request.saveAsTour()) && !planStops.isEmpty()) {
            String tourName = request.tourName() != null && !request.tourName().isBlank()
                    ? request.tourName().trim()
                    : "Tour Cá Nhân Hóa (" + availableMinutes + " phút)";

            List<CreateTourStopRequest> stopRequests = planStops.stream().map(s -> new CreateTourStopRequest(
                    s.poi().id(),
                    s.stopOrder(),
                    s.estimatedDurationMinutes(),
                    s.recommendedDishOrActivity(),
                    s.note()
            )).toList();

            CreateTourRequest createReq = new CreateTourRequest(
                    tourName,
                    "Tour được hệ thống tự động lập kế hoạch tối ưu dựa trên quỹ thời gian " + availableMinutes + " phút.",
                    deduceTheme(planStops.stream().map(s -> poiRepository.findById(s.poi().id()).orElse(null)).filter(Objects::nonNull).toList()),
                    timeSpent,
                    totalCost,
                    totalDistance,
                    planStops.get(0).poi().thumbnailUrl(),
                    request.isPublic() != null ? request.isPublic() : false,
                    "Người dùng thông minh",
                    stopRequests
            );

            TourDetailResponse savedTour = createTour(createReq, currentUserId, userRole);
            savedTourId = savedTour.id();
        }

        return new CustomPlanResponse(
                availableMinutes,
                timeSpent,
                remainingMinutes,
                totalCost,
                totalDistance,
                planStops.size(),
                planStops,
                savedTourId
        );
    }

    // ── Helper methods ────────────────────────────────────────────────

    private PoiSummaryResponse toPoiSummary(Poi p, Double distanceMeters) {
        String categoryName = poiRepository.findCategoryNameById(p.getCategoryId());
        return new PoiSummaryResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getAddress(),
                p.getThumbnailUrl(),
                p.getAvgRating(),
                p.getReviewCount(),
                p.getPriceRangeMin(),
                p.getPriceRangeMax(),
                categoryName,
                p.getPoiType(),
                p.getLongitude(),
                p.getLatitude(),
                distanceMeters != null ? Math.round(distanceMeters * 10.0) / 10.0 : null
        );
    }

    private int getDefaultDurationForPoi(Poi poi) {
        String type = poi.getPoiType() != null ? poi.getPoiType().toUpperCase() : "FOOD";
        return switch (type) {
            case "HISTORICAL" -> 50;
            case "RELIGIOUS" -> 30;
            case "LANDMARK" -> 20;
            default -> 40; // FOOD
        };
    }

    private String generateRecommendation(Poi poi) {
        String type = poi.getPoiType() != null ? poi.getPoiType().toUpperCase() : "FOOD";
        if ("FOOD".equals(type)) {
            List<Dish> dishes = dishRepository.findDishesByPoiId(poi.getId());
            List<String> signatures = dishes.stream()
                    .filter(Dish::isSignature)
                    .map(Dish::getName)
                    .limit(2)
                    .toList();
            if (!signatures.isEmpty()) {
                return "Món đặc trưng nên thử: " + String.join(", ", signatures);
            }
            if (!dishes.isEmpty()) {
                return "Món bán chạy: " + dishes.get(0).getName();
            }
            return "Thưởng thức các món ngon đặc sản đường phố trứ danh";
        } else if ("HISTORICAL".equals(type)) {
            return "Tham quan các gian trưng bày tài liệu lịch sử, ngắm bến cảng xưa";
        } else if ("RELIGIOUS".equals(type)) {
            return "Chiêm bái kiến trúc tôn giáo cổ kính, tìm hiểu văn hóa tín ngưỡng";
        } else {
            return "Check-in cảnh quan kiến trúc, ngắm toàn cảnh sông nước lung linh";
        }
    }

    private String generateStopNote(Poi poi, double distanceMeters) {
        String type = poi.getPoiType() != null ? poi.getPoiType().toUpperCase() : "FOOD";
        String distText = distanceMeters > 0 ? String.format("Khoảng cách di chuyển: %.0fm. ", distanceMeters) : "";
        if ("RELIGIOUS".equals(type) || "HISTORICAL".equals(type)) {
            return distText + "Lưu ý giữ trật tự và trang phục lịch sự, trang nghiêm.";
        }
        if ("FOOD".equals(type)) {
            return distText + "Nên đi bộ men theo hẻm để cảm nhận không khí ẩm thực sôi động.";
        }
        return distText + "Thời điểm lý tưởng để check-in và chụp ảnh hoàng hôn.";
    }

    private String deduceTheme(List<Poi> pois) {
        if (pois == null || pois.isEmpty()) return "FOOD";
        long foodCount = pois.stream().filter(p -> "FOOD".equalsIgnoreCase(p.getPoiType())).count();
        long histCount = pois.stream().filter(p -> "HISTORICAL".equalsIgnoreCase(p.getPoiType())).count();
        long relCount = pois.stream().filter(p -> "RELIGIOUS".equalsIgnoreCase(p.getPoiType())).count();
        long landCount = pois.stream().filter(p -> "LANDMARK".equalsIgnoreCase(p.getPoiType())).count();

        if (foodCount == pois.size()) return "FOOD";
        if (histCount + relCount == pois.size()) return "CULTURE";
        if (landCount == pois.size()) return "LANDMARK";
        return "MIXED";
    }

    private int calculateTotalDuration(List<CreateTourStopRequest> stopReqs, List<Poi> pois) {
        int duration = 0;
        for (int i = 0; i < stopReqs.size(); i++) {
            CreateTourStopRequest req = stopReqs.get(i);
            int stopTime = req.estimatedDurationMinutes() != null && req.estimatedDurationMinutes() > 0
                    ? req.estimatedDurationMinutes()
                    : getDefaultDurationForPoi(pois.get(i));
            duration += stopTime;

            if (i > 0) {
                double dist = calculateDistanceMeters(
                        pois.get(i - 1).getLatitude(), pois.get(i - 1).getLongitude(),
                        pois.get(i).getLatitude(), pois.get(i).getLongitude()
                );
                duration += (int) Math.max(3, Math.ceil(dist / 200.0));
            }
        }
        return duration;
    }

    private int calculateTotalCost(List<Poi> pois) {
        int cost = 0;
        for (Poi p : pois) {
            if (p.getPriceRangeMin() != null && p.getPriceRangeMin() > 0) {
                cost += p.getPriceRangeMin();
            } else {
                cost += "FOOD".equalsIgnoreCase(p.getPoiType()) ? 80000 : 30000;
            }
        }
        return cost;
    }

    private int calculateTotalDistance(List<Poi> pois) {
        int distance = 0;
        for (int i = 1; i < pois.size(); i++) {
            distance += (int) calculateDistanceMeters(
                    pois.get(i - 1).getLatitude(), pois.get(i - 1).getLongitude(),
                    pois.get(i).getLatitude(), pois.get(i).getLongitude()
            );
        }
        return distance;
    }

    public static double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) return "tour-" + System.currentTimeMillis();
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String pattern = "\\p{InCombiningDiacriticalMarks}+";
        String slug = normalized.replaceAll(pattern, "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-+|-+$", "");
        return slug.isEmpty() ? "tour-" + System.currentTimeMillis() : slug;
    }
}

