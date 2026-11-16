package com.example.tourism.user.repository;

import com.example.tourism.admin.dto.AdminUserResponse;
import com.example.tourism.user.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<User> USER_ROW_MAPPER = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setEmail(rs.getString("email"));
        try {
            user.setPasswordHash(rs.getString("password_hash"));
        } catch (Exception ignored) {}
        user.setDisplayName(rs.getString("display_name"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setProvider(rs.getString("provider"));
        user.setProviderId(rs.getString("provider_id"));
        user.setSpicy(rs.getBoolean("spicy"));
        user.setVegetarian(rs.getBoolean("vegetarian"));
        user.setNoSeafood(rs.getBoolean("no_seafood"));
        user.setRole(rs.getString("role"));
        try {
            user.setLocked(rs.getBoolean("is_locked"));
        } catch (Exception ignored) {}
        user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        user.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return user;
    };

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false");
        } catch (Exception ignored) {}
    }

    public Optional<User> findById(Long id) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE id = ?", USER_ROW_MAPPER, id);
        return users.stream().findFirst();
    }

    public Optional<User> findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE email = ?", USER_ROW_MAPPER, email);
        return users.stream().findFirst();
    }

    public Optional<User> findByProviderAndProviderId(String provider, String providerId) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE provider = ? AND provider_id = ?",
                USER_ROW_MAPPER, provider, providerId);
        return users.stream().findFirst();
    }

    public User save(User user) {
        if (user.getId() != null) {
            return update(user);
        }
        return insert(user);
    }

    private User insert(User user) {
        String sql = "INSERT INTO users (email, password_hash, display_name, avatar_url, " +
                     "provider, provider_id, spicy, vegetarian, no_seafood, role) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at, updated_at";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getEmail());
            ps.setString(2, user.getPasswordHash());
            ps.setString(3, user.getDisplayName());
            ps.setString(4, user.getAvatarUrl());
            ps.setString(5, user.getProvider() != null ? user.getProvider() : "local");
            ps.setString(6, user.getProviderId());
            ps.setBoolean(7, user.isSpicy());
            ps.setBoolean(8, user.isVegetarian());
            ps.setBoolean(9, user.isNoSeafood());
            ps.setString(10, user.getRole() != null ? user.getRole() : "USER");
            return ps;
        }, keyHolder);

        var keys = keyHolder.getKeys();
        if (keys != null) {
            user.setId(((Number) keys.get("id")).longValue());
            user.setCreatedAt(((Timestamp) keys.get("created_at")).toLocalDateTime());
            user.setUpdatedAt(((Timestamp) keys.get("updated_at")).toLocalDateTime());
        }
        return user;
    }

    public void updateRole(Long userId, String role) {
        jdbcTemplate.update("UPDATE users SET role = ? WHERE id = ?", role, userId);
    }

    public void updatePasswordHash(Long userId, String passwordHash) {
        jdbcTemplate.update("UPDATE users SET password_hash = ?, updated_at = now() WHERE id = ?", passwordHash, userId);
    }

    private User update(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        jdbcTemplate.update(
                "UPDATE users SET email = ?, display_name = ?, avatar_url = ?, " +
                "spicy = ?, vegetarian = ?, no_seafood = ?, updated_at = now() WHERE id = ?",
                user.getEmail(), user.getDisplayName(), user.getAvatarUrl(),
                user.isSpicy(), user.isVegetarian(), user.isNoSeafood(), user.getId());
        return findById(user.getId()).orElse(user);
    }

    public List<AdminUserResponse> findAdminUsersWithStats() {
        try {
            String sql = """
                SELECT 
                    u.id,
                    u.email,
                    u.display_name,
                    u.avatar_url,
                    u.provider,
                    u.provider_id,
                    u.role,
                    COALESCE(u.is_locked, false) AS is_locked,
                    u.created_at,
                    (SELECT COUNT(*) FROM audio_listen_logs a WHERE a.user_id = u.id) AS listen_count,
                    (SELECT COUNT(*) FROM checkins c WHERE c.user_id = u.id) AS checkin_count
                FROM users u
                WHERE LOWER(u.provider) IN ('phone', 'google')
                ORDER BY u.id DESC
                """;
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapAdminUserResponse(rs, true));
        } catch (Exception e) {
            String fallbackSql = """
                SELECT 
                    u.id,
                    u.email,
                    u.display_name,
                    u.avatar_url,
                    u.provider,
                    u.provider_id,
                    u.role,
                    COALESCE(u.is_locked, false) AS is_locked,
                    u.created_at
                FROM users u
                WHERE LOWER(u.provider) IN ('phone', 'google')
                ORDER BY u.id DESC
                """;
            return jdbcTemplate.query(fallbackSql, (rs, rowNum) -> mapAdminUserResponse(rs, false));
        }
    }

    private AdminUserResponse mapAdminUserResponse(ResultSet rs, boolean hasStats) throws SQLException {
        String rawRole = null;
        try {
            rawRole = rs.getString("role");
        } catch (Exception ignored) {}

        String role = "ROLE_USER";
        if (rawRole != null && !rawRole.isBlank()) {
            String upper = rawRole.trim().toUpperCase();
            role = upper.startsWith("ROLE_") ? upper : "ROLE_" + upper;
        }

        boolean locked = false;
        try {
            locked = rs.getBoolean("is_locked");
        } catch (Exception ignored) {}

        Timestamp createdAtTs = null;
        try {
            createdAtTs = rs.getTimestamp("created_at");
        } catch (Exception ignored) {}
        LocalDateTime createdAt = createdAtTs != null ? createdAtTs.toLocalDateTime() : null;

        long listenCount = 0;
        long checkinCount = 0;
        if (hasStats) {
            try {
                listenCount = rs.getLong("listen_count");
                checkinCount = rs.getLong("checkin_count");
            } catch (Exception ignored) {}
        }

        return new AdminUserResponse(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getString("avatar_url"),
                rs.getString("provider"),
                rs.getString("provider_id"),
                role,
                locked,
                listenCount,
                checkinCount,
                createdAt
        );
    }

    public void updateUserLockStatus(Long userId, boolean locked) {
        jdbcTemplate.update("UPDATE users SET is_locked = ?, updated_at = now() WHERE id = ?", locked, userId);
    }

    @Transactional
    public void deleteUser(Long userId) {
        jdbcTemplate.update("DELETE FROM guest_devices WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM favorites WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM checkins WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM user_badges WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM reviews WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM tour_reviews WHERE user_id = ?", userId);
        jdbcTemplate.update("UPDATE audio_listen_logs SET user_id = NULL WHERE user_id = ?", userId);
        jdbcTemplate.update("UPDATE dwell_logs SET user_id = NULL WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
    }
}
