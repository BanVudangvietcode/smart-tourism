package com.example.tourism.community.repository;

import com.example.tourism.community.model.Checkin;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;

@Repository
public class CheckinRepository {

    private final JdbcTemplate jdbcTemplate;

    public CheckinRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Checkin save(Checkin checkin) {
        String sql = """
            INSERT INTO checkins (user_id, poi_id, checkin_lat, checkin_lng, distance_meters, verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, now())
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, checkin.getUserId());
            ps.setLong(2, checkin.getPoiId());
            ps.setDouble(3, checkin.getCheckinLat());
            ps.setDouble(4, checkin.getCheckinLng());
            ps.setDouble(5, checkin.getDistanceMeters());
            ps.setBoolean(6, checkin.getVerified());
            return ps;
        }, keyHolder);

        Number generatedId = (Number) keyHolder.getKeys().get("id");
        if (generatedId != null) {
            checkin.setId(generatedId.longValue());
        }
        Timestamp createdAt = (Timestamp) keyHolder.getKeys().get("created_at");
        if (createdAt != null) {
            checkin.setCreatedAt(createdAt.toLocalDateTime());
        }
        return checkin;
    }

    public long countByUserId(Long userId) {
        String sql = "SELECT COUNT(*) FROM checkins WHERE user_id = ? AND verified = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
        return count != null ? count : 0L;
    }

    public long countByUserIdAndPoiId(Long userId, Long poiId) {
        String sql = "SELECT COUNT(*) FROM checkins WHERE user_id = ? AND poi_id = ? AND verified = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, userId, poiId);
        return count != null ? count : 0L;
    }
}

