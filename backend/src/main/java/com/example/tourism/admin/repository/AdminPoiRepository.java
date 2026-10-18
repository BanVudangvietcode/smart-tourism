package com.example.tourism.admin.repository;

import com.example.tourism.admin.dto.AdminPoiResponse;
import com.example.tourism.admin.dto.CreateAdminPoiRequest;
import com.example.tourism.admin.dto.UpdateAdminPoiRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.text.Normalizer;
import java.util.Optional;

@Repository
public class AdminPoiRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminPoiRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AdminPoiResponse> adminPoiRowMapper = (rs, rowNum) -> new AdminPoiResponse(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("slug"),
            rs.getString("description"),
            rs.getString("address"),
            rs.getString("district"),
            rs.getString("ward"),
            rs.getString("phone"),
            rs.getString("opening_hours"),
            (Integer) rs.getObject("price_range_min"),
            (Integer) rs.getObject("price_range_max"),
            rs.getBigDecimal("avg_rating"),
            rs.getInt("review_count"),
            rs.getInt("popularity"),
            rs.getString("audio_url"),
            rs.getString("thumbnail_url"),
            (Long) rs.getObject("category_id"),
            rs.getString("category_name"),
            rs.getString("poi_type") != null ? rs.getString("poi_type") : "FOOD",
            rs.getDouble("lat"),
            rs.getDouble("lng"),
            rs.getObject("is_active") != null ? rs.getBoolean("is_active") : true,
            rs.getTimestamp("created_at").toLocalDateTime(),
            rs.getTimestamp("updated_at").toLocalDateTime()
    );

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM pois WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    public Optional<AdminPoiResponse> findById(Long id) {
        String sql = """
                SELECT p.id, p.name, p.slug, p.description, p.address, p.district, p.ward,
                       p.phone, p.opening_hours, p.price_range_min, p.price_range_max,
                       p.avg_rating, p.review_count, p.popularity, p.audio_url, p.thumbnail_url,
                       p.category_id, p.poi_type, p.is_active, p.created_at, p.updated_at,
                       ST_X(p.location::geometry) AS lng,
                       ST_Y(p.location::geometry) AS lat,
                       c.name AS category_name
                FROM pois p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
                """;
        try {
            AdminPoiResponse poi = jdbcTemplate.queryForObject(sql, adminPoiRowMapper, id);
            return Optional.ofNullable(poi);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Long insertPoi(CreateAdminPoiRequest req, String slug, String effectiveThumbnail) {
        String sql = """
                INSERT INTO pois (
                    name, slug, description, address, district, ward, phone, opening_hours,
                    price_range_min, price_range_max, category_id, poi_type, location,
                    thumbnail_url, is_active, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                    ?, true, now(), now()
                )
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                req.name(),
                slug,
                req.description(),
                req.address(),
                req.district() != null ? req.district() : "Quận 4",
                req.ward(),
                req.phone(),
                req.openingHours(),
                req.priceRangeMin(),
                req.priceRangeMax(),
                req.categoryId(),
                req.poiType() != null ? req.poiType() : "FOOD",
                req.longitude(),
                req.latitude(),
                effectiveThumbnail
        );
    }

    public void updatePoi(Long id, UpdateAdminPoiRequest req) {
        StringBuilder sql = new StringBuilder("UPDATE pois SET updated_at = now()");

        if (req.name() != null) sql.append(", name = '").append(req.name().replace("'", "''")).append("'");
        if (req.description() != null) sql.append(", description = '").append(req.description().replace("'", "''")).append("'");
        if (req.address() != null) sql.append(", address = '").append(req.address().replace("'", "''")).append("'");
        if (req.district() != null) sql.append(", district = '").append(req.district().replace("'", "''")).append("'");
        if (req.ward() != null) sql.append(", ward = '").append(req.ward().replace("'", "''")).append("'");
        if (req.phone() != null) sql.append(", phone = '").append(req.phone().replace("'", "''")).append("'");
        if (req.openingHours() != null) sql.append(", opening_hours = '").append(req.openingHours().replace("'", "''")).append("'");
        if (req.priceRangeMin() != null) sql.append(", price_range_min = ").append(req.priceRangeMin());
        if (req.priceRangeMax() != null) sql.append(", price_range_max = ").append(req.priceRangeMax());
        if (req.categoryId() != null) sql.append(", category_id = ").append(req.categoryId());
        if (req.poiType() != null) sql.append(", poi_type = '").append(req.poiType().replace("'", "''")).append("'");
        if (req.thumbnailUrl() != null) sql.append(", thumbnail_url = '").append(req.thumbnailUrl().replace("'", "''")).append("'");
        if (req.isActive() != null) sql.append(", is_active = ").append(req.isActive());

        if (req.latitude() != null && req.longitude() != null) {
            sql.append(", location = ST_SetSRID(ST_MakePoint(")
                    .append(req.longitude())
                    .append(", ")
                    .append(req.latitude())
                    .append("), 4326)::geography");
        }

        sql.append(" WHERE id = ").append(id);
        jdbcTemplate.update(sql.toString());
    }

    public void softDeletePoi(Long id) {
        jdbcTemplate.update("UPDATE pois SET is_active = false, updated_at = now() WHERE id = ?", id);
    }

    public void insertPoiImage(Long poiId, String url, String caption, int sortOrder) {
        String sql = "INSERT INTO poi_images (poi_id, url, caption, sort_order) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, poiId, url, caption, sortOrder);
    }

    public void updatePoiAudioUrl(Long poiId, String audioUrl) {
        jdbcTemplate.update("UPDATE pois SET audio_url = ?, updated_at = now() WHERE id = ?", audioUrl, poiId);
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) return "poi-" + System.currentTimeMillis();
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String noDiacritics = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        noDiacritics = noDiacritics.replace("đ", "d").replace("Đ", "D");
        String slug = noDiacritics.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug.isBlank() ? "poi-" + System.currentTimeMillis() : slug;
    }
}

