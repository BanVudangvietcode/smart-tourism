package com.example.tourism.poi.repository;

import com.example.tourism.poi.model.Category;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CategoryRepository {

    private final JdbcTemplate jdbcTemplate;

    public CategoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Category> rowMapper = (rs, rowNum) -> {
        Category c = new Category();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setSlug(rs.getString("slug"));
        c.setIconUrl(rs.getString("icon_url"));
        c.setSortOrder(rs.getInt("sort_order"));
        c.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return c;
    };

    public List<Category> findAll() {
        return jdbcTemplate.query(
                "SELECT id, name, slug, icon_url, sort_order, created_at FROM categories ORDER BY sort_order",
                rowMapper
        );
    }
}
