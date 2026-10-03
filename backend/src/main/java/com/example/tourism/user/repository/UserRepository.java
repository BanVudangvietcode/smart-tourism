package com.example.tourism.user.repository;

import com.example.tourism.user.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
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

        user.setDisplayName(rs.getString("display_name"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setProvider(rs.getString("provider"));
        user.setProviderId(rs.getString("provider_id"));
        user.setSpicy(rs.getBoolean("spicy"));
        user.setVegetarian(rs.getBoolean("vegetarian"));
        user.setNoSeafood(rs.getBoolean("no_seafood"));
        user.setRole(rs.getString("role"));
        user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        user.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return user;
    };

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
        String sql = "INSERT INTO users (email, display_name, avatar_url, " +
                     "provider, provider_id, spicy, vegetarian, no_seafood, role) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at, updated_at";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getEmail());
            ps.setString(2, user.getDisplayName());
            ps.setString(3, user.getAvatarUrl());
            ps.setString(4, user.getProvider() != null ? user.getProvider() : "local");
            ps.setString(5, user.getProviderId());
            ps.setBoolean(6, user.isSpicy());
            ps.setBoolean(7, user.isVegetarian());
            ps.setBoolean(8, user.isNoSeafood());
            ps.setString(9, user.getRole() != null ? user.getRole() : "USER");
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

    private User update(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        jdbcTemplate.update(
                "UPDATE users SET email = ?, display_name = ?, avatar_url = ?, " +
                "spicy = ?, vegetarian = ?, no_seafood = ?, updated_at = now() WHERE id = ?",
                user.getEmail(), user.getDisplayName(), user.getAvatarUrl(),
                user.isSpicy(), user.isVegetarian(), user.isNoSeafood(), user.getId());
        return findById(user.getId()).orElse(user);
    }
}
