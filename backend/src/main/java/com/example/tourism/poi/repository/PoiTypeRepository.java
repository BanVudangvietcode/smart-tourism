package com.example.tourism.poi.repository;

import com.example.tourism.poi.model.PoiType;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PoiTypeRepository {

    private static final Logger log = LoggerFactory.getLogger(PoiTypeRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public PoiTypeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<PoiType> rowMapper = (rs, rowNum) -> {
        PoiType pt = new PoiType();
        pt.setCode(rs.getString("code"));
        pt.setName(rs.getString("name"));
        pt.setIcon(rs.getString("icon"));
        pt.setDescription(rs.getString("description"));
        pt.setSortOrder(rs.getInt("sort_order"));
        pt.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return pt;
    };

    @PostConstruct
    public void initTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS poi_types (
                    code        VARCHAR(50) PRIMARY KEY,
                    name        VARCHAR(100) NOT NULL,
                    icon        VARCHAR(50),
                    description VARCHAR(255),
                    sort_order  INT NOT NULL DEFAULT 0,
                    created_at  TIMESTAMP NOT NULL DEFAULT now()
                )
            """);

            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM poi_types", Integer.class);
            if (count == null || count == 0) {
                jdbcTemplate.update("""
                    INSERT INTO poi_types (code, name, icon, description, sort_order) VALUES
                    ('FOOD', 'Ẩm Thực & Quán Ăn', '🍲', 'Các quán ăn, nhà hàng, ẩm thực đường phố Quận 4', 1),
                    ('HISTORICAL', 'Di Tích Lịch Sử', '🏛️', 'Bến Nhà Rồng, di tích, bảo tàng lịch sử', 2),
                    ('RELIGIOUS', 'Chùa & Tôn Giáo', '⛩️', 'Chùa chiền, miếu, nhà thờ linh thiêng', 3),
                    ('LANDMARK', 'Cảnh Quan Check-in', '🌉', 'Cầu Mống, bến cảng, công viên, điểm ngắm cảnh', 4)
                    ON CONFLICT (code) DO NOTHING
                """);
                log.info("Initialized default poi_types in database");
            }

            // Ensure pois.poi_type is flexible
            jdbcTemplate.execute("ALTER TABLE pois ALTER COLUMN poi_type TYPE VARCHAR(50)");
        } catch (Exception e) {
            log.warn("Notice during poi_types table init: {}", e.getMessage());
        }
    }

    public List<PoiType> findAll() {
        return jdbcTemplate.query(
                "SELECT code, name, icon, description, sort_order, created_at FROM poi_types ORDER BY sort_order, code",
                rowMapper
        );
    }

    public Optional<PoiType> findByCode(String code) {
        List<PoiType> list = jdbcTemplate.query(
                "SELECT code, name, icon, description, sort_order, created_at FROM poi_types WHERE code = ?",
                rowMapper,
                code
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public int getNextSortOrder() {
        Integer max = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(sort_order), 0) FROM poi_types",
                Integer.class
        );
        return (max != null ? max : 0) + 1;
    }

    public void create(String code, String name, String icon, String description, int sortOrder) {
        jdbcTemplate.update(
                "INSERT INTO poi_types (code, name, icon, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, now())",
                code,
                name,
                icon != null ? icon : "📍",
                description != null ? description : "",
                sortOrder
        );
    }

    public void update(String code, String name, String icon, String description, Integer sortOrder) {
        StringBuilder sql = new StringBuilder("UPDATE poi_types SET ");
        boolean first = true;
        List<Object> params = new ArrayList<>();

        if (name != null && !name.isBlank()) {
            sql.append("name = ? ");
            params.add(name.trim());
            first = false;
        }
        if (icon != null) {
            if (!first) sql.append(", ");
            sql.append("icon = ? ");
            params.add(icon);
            first = false;
        }
        if (description != null) {
            if (!first) sql.append(", ");
            sql.append("description = ? ");
            params.add(description);
            first = false;
        }
        if (sortOrder != null) {
            if (!first) sql.append(", ");
            sql.append("sort_order = ? ");
            params.add(sortOrder);
            first = false;
        }

        if (first) return;

        sql.append("WHERE code = ?");
        params.add(code);

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    public void delete(String code) {
        // Fallback any POIs using this type to 'FOOD' to prevent broken references
        jdbcTemplate.update("UPDATE pois SET poi_type = 'FOOD' WHERE poi_type = ?", code);
        jdbcTemplate.update("DELETE FROM poi_types WHERE code = ?", code);
    }
}
