package com.example.tourism.tour.repository;

import com.example.tourism.tour.dto.TourReviewResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class TourReviewRepository {

    private final JdbcTemplate jdbcTemplate;

    public TourReviewRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<TourReviewResponse> rowMapper = (rs, rowNum) -> {
        boolean isAnon = rs.getBoolean("is_anonymous");
        String displayName = isAnon ? "Du khách ẩn danh" : rs.getString("user_display_name");
        String avatarUrl = isAnon ? null : rs.getString("user_avatar_url");

        return new TourReviewResponse(
                rs.getLong("id"),
                rs.getLong("tour_id"),
                rs.getLong("user_id"),
                displayName != null && !displayName.isBlank() ? displayName : "Du khách ẩm thực",
                avatarUrl,
                rs.getInt("rating"),
                rs.getString("comment"),
                isAnon,
                rs.getTimestamp("created_at").toLocalDateTime()
        );
    };

    public List<TourReviewResponse> findByTourId(Long tourId) {
        String sql = """
            SELECT tr.id, tr.tour_id, tr.user_id, tr.rating, tr.comment, tr.is_anonymous, tr.created_at,
                   COALESCE(u.display_name, 'Du khách ẩm thực') AS user_display_name,
                   u.avatar_url AS user_avatar_url
            FROM tour_reviews tr
            LEFT JOIN users u ON tr.user_id = u.id
            WHERE tr.tour_id = ?
            ORDER BY tr.created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper, tourId);
    }

    public long countByTourId(Long tourId) {
        String sql = "SELECT COUNT(*) FROM tour_reviews WHERE tour_id = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, tourId);
        return count != null ? count : 0L;
    }

    public Double getTourAvgRating(Long tourId) {
        String sql = "SELECT ROUND(AVG(rating)::numeric, 1) FROM tour_reviews WHERE tour_id = ?";
        return jdbcTemplate.queryForObject(sql, Double.class, tourId);
    }

    public TourReviewResponse save(Long tourId, Long userId, int rating, String comment, boolean isAnonymous, String displayName, String avatarUrl) {
        String sql = """
            INSERT INTO tour_reviews (tour_id, user_id, rating, comment, is_anonymous, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, now(), now())
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tourId);
            ps.setLong(2, userId);
            ps.setInt(3, rating);
            ps.setString(4, comment);
            ps.setBoolean(5, isAnonymous);
            return ps;
        }, keyHolder);

        Number generatedId = (Number) keyHolder.getKeys().get("id");
        Long id = generatedId != null ? generatedId.longValue() : null;
        Timestamp createdAt = (Timestamp) keyHolder.getKeys().get("created_at");

        return new TourReviewResponse(
                id,
                tourId,
                userId,
                isAnonymous ? "Du khách ẩn danh" : (displayName != null ? displayName : "Du khách ẩm thực"),
                isAnonymous ? null : avatarUrl,
                rating,
                comment,
                isAnonymous,
                createdAt != null ? createdAt.toLocalDateTime() : java.time.LocalDateTime.now()
        );
    }
}

