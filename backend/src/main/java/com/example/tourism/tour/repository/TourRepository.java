package com.example.tourism.tour.repository;

import com.example.tourism.tour.model.Tour;
import com.example.tourism.tour.model.TourStop;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class TourRepository {

    private final JdbcTemplate jdbcTemplate;

    public TourRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Tour> tourRowMapper = (rs, rowNum) -> {
        Tour t = new Tour();
        t.setId(rs.getLong("id"));
        t.setName(rs.getString("name"));
        t.setSlug(rs.getString("slug"));
        t.setDescription(rs.getString("description"));
        t.setTheme(rs.getString("theme"));
        t.setEstimatedDurationMinutes(rs.getInt("estimated_duration_minutes"));
        t.setEstimatedCost(rs.getInt("estimated_cost"));
        t.setTotalDistanceMeters(rs.getInt("total_distance_meters"));
        t.setThumbnailUrl(rs.getString("thumbnail_url"));
        t.setPublic(rs.getBoolean("is_public"));
        t.setCreatorId((Long) rs.getObject("creator_id"));
        t.setCreatorRole(rs.getString("creator_role"));
        t.setCreatorName(rs.getString("creator_name"));
        t.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        t.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return t;
    };

    private final RowMapper<TourStop> tourStopRowMapper = (rs, rowNum) -> {
        TourStop s = new TourStop();
        s.setId(rs.getLong("id"));
        s.setTourId(rs.getLong("tour_id"));
        s.setPoiId(rs.getLong("poi_id"));
        s.setStopOrder(rs.getInt("stop_order"));
        s.setEstimatedDurationMinutes(rs.getInt("estimated_duration_minutes"));
        s.setRecommendedDishOrActivity(rs.getString("recommended_dish_or_activity"));
        s.setNote(rs.getString("note"));
        s.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return s;
    };

    public List<Tour> findTours(String theme, Boolean isPublic, Long userId, String search) {
        StringBuilder sql = new StringBuilder("""
                SELECT t.id, t.name, t.slug, t.description, t.theme,
                       t.estimated_duration_minutes, t.estimated_cost, t.total_distance_meters,
                       t.thumbnail_url, t.is_public, t.creator_id, t.creator_role, t.creator_name,
                       t.created_at, t.updated_at
                FROM tours t
                WHERE 1=1
                """);
        List<Object> params = new ArrayList<>();

        if (userId != null) {
            // User can see public tours OR their own private tours
            if (Boolean.TRUE.equals(isPublic)) {
                sql.append(" AND t.is_public = true\n");
            } else if (Boolean.FALSE.equals(isPublic)) {
                sql.append(" AND t.is_public = false AND t.creator_id = ?\n");
                params.add(userId);
            } else {
                sql.append(" AND (t.is_public = true OR t.creator_id = ?)\n");
                params.add(userId);
            }
        } else {
            // Unauthenticated: only public unless isPublic explicitly queried
            if (isPublic != null) {
                sql.append(" AND t.is_public = ?\n");
                params.add(isPublic);
            } else {
                sql.append(" AND t.is_public = true\n");
            }
        }

        if (theme != null && !theme.isBlank()) {
            sql.append(" AND UPPER(t.theme) = UPPER(?)\n");
            params.add(theme.trim());
        }

        if (search != null && !search.isBlank()) {
            sql.append(" AND (t.name ILIKE ? OR t.description ILIKE ?)\n");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        sql.append(" ORDER BY t.created_at DESC\n");
        return jdbcTemplate.query(sql.toString(), tourRowMapper, params.toArray());
    }

    public Optional<Tour> findById(Long id) {
        String sql = """
                SELECT t.id, t.name, t.slug, t.description, t.theme,
                       t.estimated_duration_minutes, t.estimated_cost, t.total_distance_meters,
                       t.thumbnail_url, t.is_public, t.creator_id, t.creator_role, t.creator_name,
                       t.created_at, t.updated_at
                FROM tours t
                WHERE t.id = ?
                """;
        List<Tour> results = jdbcTemplate.query(sql, tourRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Tour> findBySlug(String slug) {
        String sql = """
                SELECT t.id, t.name, t.slug, t.description, t.theme,
                       t.estimated_duration_minutes, t.estimated_cost, t.total_distance_meters,
                       t.thumbnail_url, t.is_public, t.creator_id, t.creator_role, t.creator_name,
                       t.created_at, t.updated_at
                FROM tours t
                WHERE t.slug = ?
                """;
        List<Tour> results = jdbcTemplate.query(sql, tourRowMapper, slug);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<TourStop> findStopsByTourId(Long tourId) {
        String sql = """
                SELECT id, tour_id, poi_id, stop_order, estimated_duration_minutes,
                       recommended_dish_or_activity, note, created_at
                FROM tour_stops
                WHERE tour_id = ?
                ORDER BY stop_order ASC
                """;
        return jdbcTemplate.query(sql, tourStopRowMapper, tourId);
    }

    public int countStopsByTourId(Long tourId) {
        String sql = "SELECT COUNT(*) FROM tour_stops WHERE tour_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tourId);
        return count != null ? count : 0;
    }

    public boolean existsBySlug(String slug) {
        String sql = "SELECT COUNT(*) FROM tours WHERE slug = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, slug);
        return count != null && count > 0;
    }

    public Long saveTour(Tour tour) {
        String sql = """
                INSERT INTO tours (name, slug, description, theme, estimated_duration_minutes,
                                   estimated_cost, total_distance_meters, thumbnail_url,
                                   is_public, creator_id, creator_role, creator_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, tour.getName());
            ps.setString(2, tour.getSlug());
            ps.setString(3, tour.getDescription());
            ps.setString(4, tour.getTheme() != null ? tour.getTheme() : "FOOD");
            ps.setInt(5, tour.getEstimatedDurationMinutes());
            ps.setInt(6, tour.getEstimatedCost());
            ps.setInt(7, tour.getTotalDistanceMeters());
            ps.setString(8, tour.getThumbnailUrl());
            ps.setBoolean(9, tour.isPublic());
            if (tour.getCreatorId() != null) {
                ps.setLong(10, tour.getCreatorId());
            } else {
                ps.setNull(10, java.sql.Types.BIGINT);
            }
            ps.setString(11, tour.getCreatorRole() != null ? tour.getCreatorRole() : "ADMIN");
            ps.setString(12, tour.getCreatorName() != null ? tour.getCreatorName() : "Hệ thống Smart Tourism");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            tour.setId(key.longValue());
            return key.longValue();
        }
        throw new IllegalStateException("Failed to insert tour, no ID obtained.");
    }

    public Long saveTourStop(TourStop stop) {
        String sql = """
                INSERT INTO tour_stops (tour_id, poi_id, stop_order, estimated_duration_minutes,
                                        recommended_dish_or_activity, note)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, stop.getTourId());
            ps.setLong(2, stop.getPoiId());
            ps.setInt(3, stop.getStopOrder());
            ps.setInt(4, stop.getEstimatedDurationMinutes());
            ps.setString(5, stop.getRecommendedDishOrActivity());
            ps.setString(6, stop.getNote());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            stop.setId(key.longValue());
            return key.longValue();
        }
        throw new IllegalStateException("Failed to insert tour stop, no ID obtained.");
    }

    public void deleteTour(Long tourId) {
        jdbcTemplate.update("DELETE FROM tours WHERE id = ?", tourId);
    }
}

