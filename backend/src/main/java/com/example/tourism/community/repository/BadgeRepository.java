package com.example.tourism.community.repository;

import com.example.tourism.community.dto.BadgeResponse;
import com.example.tourism.community.model.UserBadge;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BadgeRepository {

    private final JdbcTemplate jdbcTemplate;

    public BadgeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<BadgeResponse> badgeResponseRowMapper = (rs, rowNum) -> new BadgeResponse(
            rs.getString("badge_code"),
            rs.getString("badge_name"),
            rs.getString("badge_description"),
            rs.getString("badge_icon_url"),
            rs.getTimestamp("unlocked_at").toLocalDateTime()
    );

    public boolean hasBadge(Long userId, String badgeCode) {
        String sql = "SELECT EXISTS (SELECT 1 FROM user_badges WHERE user_id = ? AND badge_code = ?)";
        Boolean exists = jdbcTemplate.queryForObject(sql, Boolean.class, userId, badgeCode);
        return Boolean.TRUE.equals(exists);
    }

    public BadgeResponse unlockBadge(Long userId, String badgeCode, String badgeName, String description, String iconUrl) {
        String sql = """
            INSERT INTO user_badges (user_id, badge_code, badge_name, badge_description, badge_icon_url, unlocked_at)
            VALUES (?, ?, ?, ?, ?, now())
            ON CONFLICT (user_id, badge_code) DO NOTHING
            """;
        jdbcTemplate.update(sql, userId, badgeCode, badgeName, description, iconUrl);

        return new BadgeResponse(
                badgeCode,
                badgeName,
                description,
                iconUrl,
                java.time.LocalDateTime.now()
        );
    }

    public List<BadgeResponse> findBadgesByUserId(Long userId) {
        String sql = """
            SELECT badge_code, badge_name, badge_description, badge_icon_url, unlocked_at
            FROM user_badges
            WHERE user_id = ?
            ORDER BY unlocked_at DESC
            """;
        return jdbcTemplate.query(sql, badgeResponseRowMapper, userId);
    }
}

