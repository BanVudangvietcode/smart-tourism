package com.example.tourism.poi.repository;

import com.example.tourism.poi.model.Poi;
import com.example.tourism.poi.model.PoiImage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PoiRepository {

    private final JdbcTemplate jdbcTemplate;

    public PoiRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ── Row mappers ──────────────────────────────────────────────

    private final RowMapper<Poi> poiRowMapper = (rs, rowNum) -> {
        Poi p = new Poi();
        p.setId(rs.getLong("id"));
        p.setName(rs.getString("name"));
        p.setSlug(rs.getString("slug"));
        p.setDescription(rs.getString("description"));
        p.setAddress(rs.getString("address"));
        p.setDistrict(rs.getString("district"));
        p.setWard(rs.getString("ward"));
        p.setPhone(rs.getString("phone"));
        p.setOpeningHours(rs.getString("opening_hours"));
        p.setPriceRangeMin((Integer) rs.getObject("price_range_min"));
        p.setPriceRangeMax((Integer) rs.getObject("price_range_max"));
        p.setAvgRating(rs.getBigDecimal("avg_rating"));
        p.setReviewCount(rs.getInt("review_count"));
        p.setPopularity(rs.getInt("popularity"));
        p.setAudioUrl(rs.getString("audio_url"));
        p.setThumbnailUrl(rs.getString("thumbnail_url"));
        p.setCategoryId((Long) rs.getObject("category_id"));
        p.setLongitude(rs.getDouble("lng"));
        p.setLatitude(rs.getDouble("lat"));
        p.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        p.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return p;
    };

    private final RowMapper<PoiImage> imageRowMapper = (rs, rowNum) -> {
        PoiImage img = new PoiImage();
        img.setId(rs.getLong("id"));
        img.setPoiId(rs.getLong("poi_id"));
        img.setUrl(rs.getString("url"));
        img.setCaption(rs.getString("caption"));
        img.setSortOrder(rs.getInt("sort_order"));
        return img;
    };

    // ── Viewport query (bounding box) ─────────────────────────────

    /**
     * Find POIs within a bounding box using PostGIS ST_MakeEnvelope and && operator.
     * The && operator tests whether bounding boxes overlap — extremely fast with GIST index.
     */
    public List<Poi> findInViewport(double minLng, double minLat, double maxLng, double maxLat) {
        String sql = """
                SELECT p.id, p.name, p.slug, p.description, p.address, p.district, p.ward,
                       p.phone, p.opening_hours, p.price_range_min, p.price_range_max,
                       p.avg_rating, p.review_count, p.popularity, p.audio_url, p.thumbnail_url,
                       p.category_id, p.created_at, p.updated_at,
                       ST_X(p.location::geometry) AS lng,
                       ST_Y(p.location::geometry) AS lat
                FROM pois p
                WHERE p.location && ST_MakeEnvelope(?, ?, ?, ?, 4326)::geography
                ORDER BY p.popularity DESC
                LIMIT 200
                """;
        return jdbcTemplate.query(sql, poiRowMapper, minLng, minLat, maxLng, maxLat);
    }

    // ── Nearby query (radius) ────────────────────────────────────

    /**
     * Find POIs within a radius using PostGIS ST_DWithin.
     * ST_DWithin on geography columns computes real-world distance in meters.
     */
    public List<Poi> findNearby(double lat, double lng, double radiusInMeters, int limit) {
        String sql = """
                SELECT p.id, p.name, p.slug, p.description, p.address, p.district, p.ward,
                       p.phone, p.opening_hours, p.price_range_min, p.price_range_max,
                       p.avg_rating, p.review_count, p.popularity, p.audio_url, p.thumbnail_url,
                       p.category_id, p.created_at, p.updated_at,
                       ST_X(p.location::geometry) AS lng,
                       ST_Y(p.location::geometry) AS lat,
                       ST_Distance(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters
                FROM pois p
                WHERE ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
                ORDER BY distance_meters ASC
                LIMIT ?
                """;
        return jdbcTemplate.query(sql, poiRowMapper, lng, lat, lng, lat, radiusInMeters, limit);
    }

    /**
     * Get distance for nearby queries. This is extracted separately from the row mapper
     * because the 'distance_meters' column only exists in the nearby query.
     */
    public List<Double> findNearbyDistances(double lat, double lng, double radiusInMeters, int limit) {
        String sql = """
                SELECT ST_Distance(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters
                FROM pois p
                WHERE ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
                ORDER BY distance_meters ASC
                LIMIT ?
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getDouble("distance_meters"),
                lng, lat, lng, lat, radiusInMeters, limit);
    }

    // ── Single POI detail ─────────────────────────────────────────

    public Optional<Poi> findById(Long id) {
        String sql = """
                SELECT p.id, p.name, p.slug, p.description, p.address, p.district, p.ward,
                       p.phone, p.opening_hours, p.price_range_min, p.price_range_max,
                       p.avg_rating, p.review_count, p.popularity, p.audio_url, p.thumbnail_url,
                       p.category_id, p.created_at, p.updated_at,
                       ST_X(p.location::geometry) AS lng,
                       ST_Y(p.location::geometry) AS lat
                FROM pois p
                WHERE p.id = ?
                """;
        List<Poi> results = jdbcTemplate.query(sql, poiRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<PoiImage> findImagesByPoiId(Long poiId) {
        return jdbcTemplate.query(
                "SELECT id, poi_id, url, caption, sort_order FROM poi_images WHERE poi_id = ? ORDER BY sort_order",
                imageRowMapper, poiId
        );
    }

    public String findCategoryNameById(Long categoryId) {
        if (categoryId == null) return null;
        List<String> results = jdbcTemplate.query(
                "SELECT name FROM categories WHERE id = ?",
                (rs, rowNum) -> rs.getString("name"), categoryId
        );
        return results.isEmpty() ? null : results.get(0);
    }

    // ── Full-text + geo search ─────────────────────────────────────

    /**
     * Search POIs combining full-text search, category filter, district/ward filter,
     * and optional distance-based sorting.
     */
    public List<Poi> search(String keyword, Long categoryId, String districtWard,
                            String sortBy, Double userLat, Double userLng) {
        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        sql.append("""
                SELECT p.id, p.name, p.slug, p.description, p.address, p.district, p.ward,
                       p.phone, p.opening_hours, p.price_range_min, p.price_range_max,
                       p.avg_rating, p.review_count, p.popularity, p.audio_url, p.thumbnail_url,
                       p.category_id, p.created_at, p.updated_at,
                       ST_X(p.location::geometry) AS lng,
                       ST_Y(p.location::geometry) AS lat
                """);

        // Add distance column if sorting by distance
        if ("distance".equals(sortBy) && userLat != null && userLng != null) {
            sql.append(", ST_Distance(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters\n");
            params.add(userLng);
            params.add(userLat);
        }

        sql.append("FROM pois p\nWHERE 1=1\n");

        // Full-text search filter
        if (keyword != null && !keyword.isBlank()) {
            sql.append("AND to_tsvector('simple', p.name) @@ plainto_tsquery('simple', ?)\n");
            params.add(keyword.trim());
        }

        // Category filter
        if (categoryId != null) {
            sql.append("AND p.category_id = ?\n");
            params.add(categoryId);
        }

        // District/ward filter
        if (districtWard != null && !districtWard.isBlank()) {
            sql.append("AND (p.district ILIKE ? OR p.ward ILIKE ?)\n");
            String pattern = "%" + districtWard.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        // Sorting
        switch (sortBy != null ? sortBy : "popularity") {
            case "distance" -> {
                if (userLat != null && userLng != null) {
                    sql.append("ORDER BY distance_meters ASC\n");
                } else {
                    sql.append("ORDER BY p.popularity DESC\n");
                }
            }
            case "rating" -> sql.append("ORDER BY p.avg_rating DESC, p.review_count DESC\n");
            default -> sql.append("ORDER BY p.popularity DESC\n");
        }

        sql.append("LIMIT 50\n");

        return jdbcTemplate.query(sql.toString(), poiRowMapper, params.toArray());
    }

    /**
     * Get distances for search results when sorting by distance.
     */
    public List<Double> searchDistances(String keyword, Long categoryId, String districtWard,
                                        Double userLat, Double userLng) {
        if (userLat == null || userLng == null) return List.of();

        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        sql.append("SELECT ST_Distance(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters\n");
        params.add(userLng);
        params.add(userLat);

        sql.append("FROM pois p\nWHERE 1=1\n");

        if (keyword != null && !keyword.isBlank()) {
            sql.append("AND to_tsvector('simple', p.name) @@ plainto_tsquery('simple', ?)\n");
            params.add(keyword.trim());
        }
        if (categoryId != null) {
            sql.append("AND p.category_id = ?\n");
            params.add(categoryId);
        }
        if (districtWard != null && !districtWard.isBlank()) {
            sql.append("AND (p.district ILIKE ? OR p.ward ILIKE ?)\n");
            String pattern = "%" + districtWard.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        sql.append("ORDER BY distance_meters ASC\nLIMIT 50\n");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> rs.getDouble("distance_meters"), params.toArray());
    }
}
