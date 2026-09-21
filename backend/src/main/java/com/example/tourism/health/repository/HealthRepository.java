package com.example.tourism.health.repository;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class HealthRepository {

    private final JdbcTemplate jdbcTemplate;

    public HealthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isDatabaseAvailable() {
        try {
            Boolean postgisEnabled = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')",
                    Boolean.class
            );
            return Boolean.TRUE.equals(postgisEnabled);
        } catch (DataAccessException exception) {
            return false;
        }
    }
}
