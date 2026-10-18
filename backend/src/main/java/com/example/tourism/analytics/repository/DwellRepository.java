package com.example.tourism.analytics.repository;

import com.example.tourism.analytics.dto.DwellEventResponse;
import com.example.tourism.analytics.dto.HeatmapGeoJsonResponse;
import com.example.tourism.analytics.dto.HotspotPoiSummary;
import com.example.tourism.analytics.model.DwellLog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public class DwellRepository {

    private final JdbcTemplate jdbcTemplate;

    public DwellRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record PoiMatch(Long id, String name) {}

    public Optional<PoiMatch> findNearestPoi(double lat, double lng, double maxDistanceMeters) {
        String sql = """
            SELECT id, name
            FROM pois
            WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
            ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) ASC
            LIMIT 1
            """;

        List<PoiMatch> matches = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new PoiMatch(rs.getLong("id"), rs.getString("name")),
                lng, lat, maxDistanceMeters, lng, lat
        );

        return matches.isEmpty() ? Optional.empty() : Optional.of(matches.get(0));
    }

    public DwellEventResponse save(DwellLog log, String matchedPoiName) {
        String sql = """
            INSERT INTO dwell_logs (device_id, user_id, location, dwell_seconds, matched_poi_id, created_at)
            VALUES (?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?, ?, ?)
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
            ps.setDouble(3, log.getLongitude());
            ps.setDouble(4, log.getLatitude());
            ps.setInt(5, log.getDwellSeconds());
            if (log.getMatchedPoiId() != null) {
                ps.setLong(6, log.getMatchedPoiId());
            } else {
                ps.setNull(6, java.sql.Types.BIGINT);
            }
            ps.setTimestamp(7, Timestamp.valueOf(now));
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Long id = keys != null && keys.containsKey("id")
                ? ((Number) keys.get("id")).longValue()
                : (keyHolder.getKey() != null ? keyHolder.getKey().longValue() : 1L);

        return new DwellEventResponse(
                id,
                log.getDeviceId(),
                log.getUserId(),
                log.getLatitude(),
                log.getLongitude(),
                log.getDwellSeconds(),
                log.getMatchedPoiId(),
                matchedPoiName,
                now
        );
    }

    public HeatmapGeoJsonResponse findHeatmapFeatures(int minDwellSeconds, int limit) {
        String sql = """
            SELECT d.id, d.device_id, d.dwell_seconds,
                   ST_X(d.location::geometry) AS lng,
                   ST_Y(d.location::geometry) AS lat,
                   d.matched_poi_id,
                   p.name AS matched_poi_name,
                   d.created_at
            FROM dwell_logs d
            LEFT JOIN pois p ON d.matched_poi_id = p.id
            WHERE d.dwell_seconds >= ?
            ORDER BY d.created_at DESC
            LIMIT ?
            """;

        List<HeatmapGeoJsonResponse.HeatmapFeature> features = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    double lng = rs.getDouble("lng");
                    double lat = rs.getDouble("lat");
                    int dwellSec = rs.getInt("dwell_seconds");
                    Long poiId = rs.getObject("matched_poi_id") != null ? rs.getLong("matched_poi_id") : null;
                    String poiName = rs.getString("matched_poi_name");
                    LocalDateTime createdAt = rs.getTimestamp("created_at") != null
                            ? rs.getTimestamp("created_at").toLocalDateTime()
                            : null;

                    // Normalize intensity between 0.1 and 1.0 (log scale)
                    double intensity = Math.min(1.0, Math.max(0.1, Math.log10(1 + dwellSec) / 3.0));
                    intensity = Math.round(intensity * 100.0) / 100.0;

                    Map<String, Object> properties = new LinkedHashMap<>();
                    properties.put("id", rs.getLong("id"));
                    properties.put("deviceId", rs.getString("device_id"));
                    properties.put("dwellSeconds", dwellSec);
                    properties.put("dwellMinutes", Math.round((dwellSec / 60.0) * 10.0) / 10.0);
                    properties.put("intensity", intensity);
                    properties.put("matchedPoiId", poiId);
                    properties.put("matchedPoiName", poiName);
                    properties.put("recordedAt", createdAt != null ? createdAt.toString() : null);

                    return HeatmapGeoJsonResponse.HeatmapFeature.point(lng, lat, properties);
                },
                minDwellSeconds, limit
        );

        return HeatmapGeoJsonResponse.of(features);
    }

    public long countTotalDwellEvents() {
        Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM dwell_logs", Long.class);
        return count != null ? count : 0L;
    }

    public double sumDwellMinutes() {
        Double sum = jdbcTemplate.queryForObject("SELECT coalesce(sum(dwell_seconds), 0) / 60.0 FROM dwell_logs", Double.class);
        return sum != null ? Math.round(sum * 10.0) / 10.0 : 0.0;
    }

    public double avgDwellMinutes() {
        Double avg = jdbcTemplate.queryForObject("SELECT coalesce(avg(dwell_seconds), 0) / 60.0 FROM dwell_logs", Double.class);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public List<HotspotPoiSummary> findTopHotspots(int limit) {
        String sql = """
            SELECT p.id AS poi_id,
                   p.name AS poi_name,
                   coalesce(c.name, 'Chung') AS category_name,
                   coalesce(listen_sub.listens, 0) AS listen_count,
                   coalesce(checkin_sub.checkins, 0) AS checkin_count,
                   coalesce(dwell_sub.total_dwell_mins, 0.0) AS total_dwell_minutes,
                   coalesce(p.avg_rating, 0.0) AS avg_rating
            FROM pois p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT poi_id, count(*) AS listens
                FROM audio_listen_logs
                GROUP BY poi_id
            ) listen_sub ON p.id = listen_sub.poi_id
            LEFT JOIN (
                SELECT poi_id, count(*) AS checkins
                FROM checkins
                GROUP BY poi_id
            ) checkin_sub ON p.id = checkin_sub.poi_id
            LEFT JOIN (
                SELECT matched_poi_id, round(coalesce(sum(dwell_seconds), 0) / 60.0, 1) AS total_dwell_mins
                FROM dwell_logs
                WHERE matched_poi_id IS NOT NULL
                GROUP BY matched_poi_id
            ) dwell_sub ON p.id = dwell_sub.matched_poi_id
            ORDER BY (coalesce(listen_sub.listens, 0) * 2 + coalesce(checkin_sub.checkins, 0) * 3 + coalesce(dwell_sub.total_dwell_mins, 0)) DESC
            LIMIT ?
            """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new HotspotPoiSummary(
                        rs.getLong("poi_id"),
                        rs.getString("poi_name"),
                        rs.getString("category_name"),
                        rs.getInt("listen_count"),
                        rs.getInt("checkin_count"),
                        rs.getDouble("total_dwell_minutes"),
                        rs.getDouble("avg_rating")
                ),
                limit
        );
    }

    public int countTotalTours() {
        Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM tours", Integer.class);
        return count != null ? count : 0;
    }

    public int avgTourDurationMinutes() {
        Double avg = jdbcTemplate.queryForObject("SELECT coalesce(avg(estimated_duration_minutes), 0) FROM tours", Double.class);
        return avg != null ? (int) Math.round(avg) : 0;
    }

    public int countTotalCheckins() {
        Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM checkins", Integer.class);
        return count != null ? count : 0;
    }

    public int countTotalReviews() {
        Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM reviews", Integer.class);
        return count != null ? count : 0;
    }

    public int countTotalFavorites() {
        Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM favorites", Integer.class);
        return count != null ? count : 0;
    }
}

