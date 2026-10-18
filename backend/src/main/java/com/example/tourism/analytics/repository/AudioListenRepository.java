package com.example.tourism.analytics.repository;

import com.example.tourism.analytics.dto.AudioListenResponse;
import com.example.tourism.analytics.model.AudioListenLog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

@Repository
public class AudioListenRepository {

    private final JdbcTemplate jdbcTemplate;

    public AudioListenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AudioListenResponse save(AudioListenLog log, String poiName) {
        String sql = """
            INSERT INTO audio_listen_logs (device_id, user_id, poi_id, duration_seconds, completed, trigger_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, log.getDeviceId());
            if (log.getUserId() != null) {
                ps.setLong(2, log.getUserId());
            } else {
                ps.setNull(2, java.sql.Types.BIGINT);
            }
            ps.setLong(3, log.getPoiId());
            ps.setInt(4, log.getDurationSeconds());
            ps.setBoolean(5, log.isCompleted());
            ps.setString(6, log.getTriggerType());
            ps.setTimestamp(7, Timestamp.valueOf(now));
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Long id = keys != null && keys.containsKey("id")
                ? ((Number) keys.get("id")).longValue()
                : (keyHolder.getKey() != null ? keyHolder.getKey().longValue() : 1L);

        return new AudioListenResponse(
                id,
                log.getDeviceId(),
                log.getUserId(),
                log.getPoiId(),
                poiName,
                log.getDurationSeconds(),
                log.isCompleted(),
                log.getTriggerType(),
                now
        );
    }

    public long countTotalListens() {
        Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM audio_listen_logs", Long.class);
        return count != null ? count : 0L;
    }

    public long countCompletedListens() {
        Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM audio_listen_logs WHERE completed = true", Long.class);
        return count != null ? count : 0L;
    }

    public long sumListenSeconds() {
        Long sum = jdbcTemplate.queryForObject("SELECT coalesce(sum(duration_seconds), 0) FROM audio_listen_logs", Long.class);
        return sum != null ? sum : 0L;
    }

    public double avgListenSeconds() {
        Double avg = jdbcTemplate.queryForObject("SELECT coalesce(avg(duration_seconds), 0) FROM audio_listen_logs", Double.class);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public long countByTriggerType(String triggerType) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM audio_listen_logs WHERE upper(trigger_type) = upper(?)",
                Long.class,
                triggerType
        );
        return count != null ? count : 0L;
    }
}

