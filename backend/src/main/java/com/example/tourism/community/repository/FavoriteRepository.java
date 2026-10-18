package com.example.tourism.community.repository;

import com.example.tourism.community.dto.UserFavoritePoiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FavoriteRepository {

    private final JdbcTemplate jdbcTemplate;

    public FavoriteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<UserFavoritePoiResponse> favoriteRowMapper = (rs, rowNum) -> new UserFavoritePoiResponse(
            rs.getLong("poi_id"),
            rs.getString("name"),
            rs.getString("slug"),
            rs.getString("poi_type"),
            rs.getString("category_name"),
            rs.getString("address"),
            rs.getString("thumbnail_url"),
            rs.getDouble("avg_rating"),
            rs.getInt("review_count"),
            rs.getDouble("latitude"),
            rs.getDouble("longitude"),
            rs.getTimestamp("favorited_at").toLocalDateTime()
    );

    public boolean addFavorite(Long userId, Long poiId) {
        String sql = """
            INSERT INTO favorites (user_id, poi_id, created_at)
            VALUES (?, ?, now())
            ON CONFLICT (user_id, poi_id) DO NOTHING
            """;
        int rows = jdbcTemplate.update(sql, userId, poiId);
        return rows > 0;
    }

    public boolean removeFavorite(Long userId, Long poiId) {
        String sql = "DELETE FROM favorites WHERE user_id = ? AND poi_id = ?";
        int rows = jdbcTemplate.update(sql, userId, poiId);
        return rows > 0;
    }

    public boolean isFavorite(Long userId, Long poiId) {
        String sql = "SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = ? AND poi_id = ?)";
        Boolean exists = jdbcTemplate.queryForObject(sql, Boolean.class, userId, poiId);
        return Boolean.TRUE.equals(exists);
    }

    public List<UserFavoritePoiResponse> findFavoritesByUserId(Long userId) {
        String sql = """
            SELECT f.poi_id, p.name, p.slug, p.poi_type, c.name AS category_name, p.address,
                   p.thumbnail_url, p.avg_rating, p.review_count,
                   ST_Y(p.location::geometry) AS latitude,
                   ST_X(p.location::geometry) AS longitude,
                   f.created_at AS favorited_at
            FROM favorites f
            JOIN pois p ON f.poi_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
            """;
        return jdbcTemplate.query(sql, favoriteRowMapper, userId);
    }
}

