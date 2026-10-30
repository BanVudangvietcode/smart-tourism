package com.example.tourism.poi.controller;

import com.example.tourism.dish.dto.PoiMenuResponse;
import com.example.tourism.dish.service.DishService;
import com.example.tourism.poi.dto.GeoJsonFeatureCollection;
import com.example.tourism.poi.dto.PoiDetailResponse;
import com.example.tourism.poi.dto.PoiSummaryResponse;
import com.example.tourism.poi.service.PoiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pois")
@CrossOrigin(origins = "http://localhost:3000")
public class PoiController {

    private final PoiService poiService;
    private final DishService dishService;

    public PoiController(PoiService poiService, DishService dishService) {
        this.poiService = poiService;
        this.dishService = dishService;
    }

    /**
     * GET /api/v1/pois/in-viewport
     * Returns POIs within the map viewport as a GeoJSON FeatureCollection.
     * Uses PostGIS && operator with ST_MakeEnvelope for fast bounding-box queries.
     */
    @GetMapping("/in-viewport")
    public ResponseEntity<GeoJsonFeatureCollection> getInViewport(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(defaultValue = "15") int zoom,
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String lang) {
        GeoJsonFeatureCollection result = poiService.getInViewport(minLng, minLat, maxLng, maxLat, zoom, lang);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/pois/nearby
     * Returns POIs near the user's location, sorted by distance.
     * Uses PostGIS ST_DWithin for efficient radius queries on geography columns.
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<PoiSummaryResponse>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "500") double radiusInMeters,
            @RequestParam(defaultValue = "20") int limit,
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String lang) {
        List<PoiSummaryResponse> results = poiService.getNearby(lat, lng, radiusInMeters, limit, lang);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/v1/pois/{id}
     * Returns full POI detail. Results are cached in Redis (30 min TTL).
     */
    @GetMapping("/{id}")
    public ResponseEntity<PoiDetailResponse> getById(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String lang) {
        return poiService.getById(id, lang)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/pois/search
     * Full-text search + geo filter + sorting.
     * Combines PostgreSQL to_tsvector/plainto_tsquery with PostGIS distance calculation.
     */
    @GetMapping("/search")
    public ResponseEntity<List<PoiSummaryResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(name = "district_ward", required = false) String districtWard,
            @RequestParam(name = "sort_by", defaultValue = "popularity") String sortBy,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String lang) {
        List<PoiSummaryResponse> results = poiService.search(q, categoryId, districtWard, sortBy, lat, lng, lang);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/v1/pois/{poiId}/menu
     * Returns restaurant menu grouped by category (Món ăn chơi, Món chính, Đồ uống),
     * with Best-seller (is_signature) flag.
     * Cached on Redis with 15-minute TTL.
     */
    @GetMapping("/{poiId}/menu")
    public ResponseEntity<PoiMenuResponse> getMenu(
            @PathVariable Long poiId,
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String lang) {
        return dishService.getMenuByPoiId(poiId, lang)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

