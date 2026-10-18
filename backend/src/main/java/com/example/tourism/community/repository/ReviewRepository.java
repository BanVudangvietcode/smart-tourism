package com.example.tourism.community.repository;

import com.example.tourism.community.dto.ReviewResponse;
import com.example.tourism.community.model.Review;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Repository
public class ReviewRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReviewRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<ReviewResponse> reviewResponseRowMapper = (rs, rowNum) -> {
        Array imagesArray = rs.getArray("images");
        List<String> images = new ArrayList<>();
        if (imagesArray != null) {
            String[] arr = (String[]) imagesArray.getArray();
            if (arr != null) {
                images.addAll(Arrays.asList(arr));
            }
        }

        return new ReviewResponse(
                rs.getLong("id"),
                rs.getLong("poi_id"),
                rs.getLong("user_id"),
                rs.getString("user_display_name"),
                rs.getString("user_avatar_url"),
                rs.getInt("rating"),
                rs.getString("comment"),
                images,
                rs.getTimestamp("created_at").toLocalDateTime()
        );
    };

    public ReviewResponse save(Review review, String userDisplayName, String userAvatarUrl) {
        String sql = """
            INSERT INTO reviews (poi_id, user_id, rating, comment, images, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, now(), now())
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, review.getPoiId());
            ps.setLong(2, review.getUserId());
            ps.setInt(3, review.getRating());
            ps.setString(4, review.getComment());

            String[] imgArr = review.getImages() != null ? review.getImages().toArray(new String[0]) : new String[0];
            Array sqlArray = connection.createArrayOf("text", imgArr);
            ps.setArray(5, sqlArray);
            return ps;
        }, keyHolder);

        Number generatedId = (Number) keyHolder.getKeys().get("id");
        Long id = generatedId != null ? generatedId.longValue() : null;
        Timestamp createdAt = (Timestamp) keyHolder.getKeys().get("created_at");

        return new ReviewResponse(
                id,
                review.getPoiId(),
                review.getUserId(),
                userDisplayName,
                userAvatarUrl,
                review.getRating(),
                review.getComment(),
                review.getImages() != null ? review.getImages() : List.of(),
                createdAt != null ? createdAt.toLocalDateTime() : java.time.LocalDateTime.now()
        );
    }

    public List<ReviewResponse> findByPoiId(Long poiId, int offset, int limit, String sort) {
        String orderBy = switch (sort != null ? sort.toLowerCase() : "newest") {
            case "highest_rating" -> "r.rating DESC, r.created_at DESC";
            case "lowest_rating" -> "r.rating ASC, r.created_at DESC";
            default -> "r.created_at DESC";
        };

        String sql = """
            SELECT r.id, r.poi_id, r.user_id, r.rating, r.comment, r.images, r.created_at,
                   COALESCE(u.display_name, 'Du khách ẩn danh') AS user_display_name,
                   u.avatar_url AS user_avatar_url
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.poi_id = ?
            ORDER BY %s
            LIMIT ? OFFSET ?
            """.formatted(orderBy);

        return jdbcTemplate.query(sql, reviewResponseRowMapper, poiId, limit, offset);
    }

    public long countByPoiId(Long poiId) {
        String sql = "SELECT COUNT(*) FROM reviews WHERE poi_id = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, poiId);
        return count != null ? count : 0L;
    }

    public void updatePoiRatingStats(Long poiId) {
        String sql = """
            UPDATE pois
            SET avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE poi_id = ?), 0.00),
                review_count = (SELECT COUNT(*) FROM reviews WHERE poi_id = ?)
            WHERE id = ?
            """;
        jdbcTemplate.update(sql, poiId, poiId, poiId);
    }

    public Double getPoiAvgRating(Long poiId) {
        String sql = "SELECT avg_rating FROM pois WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, Double.class, poiId);
    }

    public Integer getPoiReviewCount(Long poiId) {
        String sql = "SELECT review_count FROM pois WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, poiId);
    }
}

