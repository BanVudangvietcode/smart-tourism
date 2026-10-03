package com.example.tourism.user.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class GuestDeviceRepository {

    private final JdbcTemplate jdbcTemplate;

    public GuestDeviceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Find the user_id associated with a device.
     */
    public Long findUserIdByDeviceId(String deviceId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT user_id FROM guest_devices WHERE device_id = ?", deviceId);
        if (rows.isEmpty()) {
            return null;
        }
        return ((Number) rows.get(0).get("user_id")).longValue();
    }

    /**
     * Register a new guest device linked to a user.
     */
    public void save(String deviceId, String os, Long userId) {
        jdbcTemplate.update(
                "INSERT INTO guest_devices (device_id, os, user_id) VALUES (?, ?, ?)",
                deviceId, os, userId);
    }
}
