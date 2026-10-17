package com.example.tourism.poi.service;

import com.example.tourism.poi.dto.*;
import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.model.PoiImage;
import com.example.tourism.poi.repository.PoiRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class PoiService {

    private static final Logger log = LoggerFactory.getLogger(PoiService.class);
    private static final String POI_CACHE_PREFIX = "poi:detail:";
    private static final Duration POI_CACHE_TTL = Duration.ofMinutes(30);

    private final PoiRepository poiRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public PoiService(PoiRepository poiRepository,
                      RedisTemplate<String, Object> redisTemplate,
                      ObjectMapper objectMapper) {
        this.poiRepository = poiRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    // ── Viewport (bounding box) ────────────────────────────────────────

    public GeoJsonFeatureCollection getInViewport(double minLng, double minLat,
                                                   double maxLng, double maxLat, int zoom) {
        List<Poi> pois = poiRepository.findInViewport(minLng, minLat, maxLng, maxLat);
        List<GeoJsonFeature> features = pois.stream()
                .map(p -> toGeoJsonFeature(p, null))
                .toList();
        return new GeoJsonFeatureCollection(features);
    }

    // ── Nearby (radius) ────────────────────────────────────────────────

    public List<PoiSummaryResponse> getNearby(double lat, double lng,
                                               double radiusInMeters, int limit) {
        List<Poi> pois = poiRepository.findNearby(lat, lng, radiusInMeters, limit);
        List<Double> distances = poiRepository.findNearbyDistances(lat, lng, radiusInMeters, limit);

        List<PoiSummaryResponse> results = new ArrayList<>();
        for (int i = 0; i < pois.size(); i++) {
            Double dist = i < distances.size() ? distances.get(i) : null;
            results.add(toSummary(pois.get(i), dist));
        }
        return results;
    }

    // ── Detail (single POI, cached in Redis) ───────────────────────────

    public Optional<PoiDetailResponse> getById(Long id) {
        // Try Redis cache first
        String cacheKey = POI_CACHE_PREFIX + id;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache HIT for POI {}", id);
                String json = objectMapper.writeValueAsString(cached);
                return Optional.of(objectMapper.readValue(json, PoiDetailResponse.class));
            }
        } catch (Exception e) {
            log.warn("Redis cache read failed for POI {}, falling back to DB", id, e);
        }

        log.debug("Cache MISS for POI {}", id);

        // Fetch from database
        Optional<Poi> poiOpt = poiRepository.findById(id);
        if (poiOpt.isEmpty()) {
            return Optional.empty();
        }

        Poi poi = poiOpt.get();
        List<PoiImage> images = poiRepository.findImagesByPoiId(id);
        String categoryName = poiRepository.findCategoryNameById(poi.getCategoryId());

        PoiDetailResponse detail = toDetail(poi, categoryName, images);

        // Store in Redis cache
        try {
            redisTemplate.opsForValue().set(cacheKey, detail, POI_CACHE_TTL);
            log.debug("Cached POI {} in Redis", id);
        } catch (Exception e) {
            log.warn("Failed to cache POI {} in Redis", id, e);
        }

        return Optional.of(detail);
    }

    // ── Search ─────────────────────────────────────────────────────────

    public List<PoiSummaryResponse> search(String keyword, Long categoryId,
                                            String districtWard, String sortBy,
                                            Double userLat, Double userLng) {
        List<Poi> pois = poiRepository.search(keyword, categoryId, districtWard,
                                              sortBy, userLat, userLng);

        if ("distance".equals(sortBy) && userLat != null && userLng != null) {
            List<Double> distances = poiRepository.searchDistances(keyword, categoryId,
                                                                   districtWard, userLat, userLng);
            List<PoiSummaryResponse> results = new ArrayList<>();
            for (int i = 0; i < pois.size(); i++) {
                Double dist = i < distances.size() ? distances.get(i) : null;
                results.add(toSummary(pois.get(i), dist));
            }
            return results;
        }

        return pois.stream()
                .map(p -> toSummary(p, null))
                .toList();
    }

    // ── Mapping helpers ────────────────────────────────────────────────

    private GeoJsonFeature toGeoJsonFeature(Poi p, Double distanceMeters) {
        String categoryName = poiRepository.findCategoryNameById(p.getCategoryId());
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("id", p.getId());
        props.put("name", p.getName());
        props.put("slug", p.getSlug());
        props.put("address", p.getAddress());
        props.put("thumbnailUrl", p.getThumbnailUrl());
        props.put("avgRating", p.getAvgRating());
        props.put("reviewCount", p.getReviewCount());
        props.put("priceRangeMin", p.getPriceRangeMin());
        props.put("priceRangeMax", p.getPriceRangeMax());
        props.put("categoryName", categoryName);
        props.put("poiType", p.getPoiType());
        if (distanceMeters != null) {
            props.put("distanceMeters", Math.round(distanceMeters * 100.0) / 100.0);
        }
        return new GeoJsonFeature(
                GeoJsonGeometry.point(p.getLongitude(), p.getLatitude()),
                props
        );
    }

    private PoiSummaryResponse toSummary(Poi p, Double distanceMeters) {
        String categoryName = poiRepository.findCategoryNameById(p.getCategoryId());
        return new PoiSummaryResponse(
                p.getId(), p.getName(), p.getSlug(), p.getAddress(),
                p.getThumbnailUrl(), p.getAvgRating(), p.getReviewCount(),
                p.getPriceRangeMin(), p.getPriceRangeMax(), categoryName,
                p.getPoiType(),
                p.getLongitude(), p.getLatitude(),
                distanceMeters != null ? Math.round(distanceMeters * 100.0) / 100.0 : null
        );
    }

    private PoiDetailResponse toDetail(Poi p, String categoryName, List<PoiImage> images) {
        List<PoiImageResponse> imageResponses = images.stream()
                .map(img -> new PoiImageResponse(img.getId(), img.getUrl(), img.getCaption(), img.getSortOrder()))
                .toList();

        return new PoiDetailResponse(
                p.getId(), p.getName(), p.getSlug(), p.getDescription(),
                p.getAddress(), p.getDistrict(), p.getWard(), p.getPhone(),
                p.getOpeningHours(), p.getPriceRangeMin(), p.getPriceRangeMax(),
                p.getAvgRating(), p.getReviewCount(), p.getPopularity(),
                p.getAudioUrl(), p.getThumbnailUrl(), categoryName,
                p.getPoiType(),
                p.getLongitude(), p.getLatitude(), imageResponses
        );
    }
}
