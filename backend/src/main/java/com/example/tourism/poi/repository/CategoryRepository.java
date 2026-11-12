package com.example.tourism.poi.repository;

import com.example.tourism.poi.model.Category;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
        try { c.setNameEn(rs.getString("name_en")); } catch (Exception ignored) {}
        c.setSlug(rs.getString("slug"));
        c.setIconUrl(rs.getString("icon_url"));
        c.setSortOrder(rs.getInt("sort_order"));
        c.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return c;
    };

    public List<Category> findAll() {
        return jdbcTemplate.query(
                "SELECT id, name, name_en, slug, icon_url, sort_order, created_at FROM categories ORDER BY sort_order, id",
                rowMapper
        );
    }

    public Optional<Category> findById(Long id) {
        List<Category> list = jdbcTemplate.query(
                "SELECT id, name, name_en, slug, icon_url, sort_order, created_at FROM categories WHERE id = ?",
                rowMapper,
                id
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public int getNextSortOrder() {
        Integer max = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(sort_order), 0) FROM categories",
                Integer.class
        );
        return (max != null ? max : 0) + 1;
    }

    public Long create(String name, String slug, String iconUrl, int sortOrder) {
        String effectiveSlug = (slug != null && !slug.isBlank())
                ? slug
                : name.toLowerCase()
                        .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                        .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                        .replaceAll("[ìíịỉĩ]", "i")
                        .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                        .replaceAll("[ùúụủũưừứựửữ]", "u")
                        .replaceAll("[ỳýỵỷỹ]", "y")
                        .replaceAll("[đ]", "d")
                        .replaceAll("[^a-z0-9]+", "-")
                        .replaceAll("^-|-$", "") + "-" + System.currentTimeMillis() % 10000;

        return jdbcTemplate.queryForObject(
                "INSERT INTO categories (name, slug, icon_url, sort_order, created_at) VALUES (?, ?, ?, ?, now()) RETURNING id",
                Long.class,
                name,
                effectiveSlug,
                iconUrl,
                sortOrder
        );
    }

    public void update(Long id, String name, String slug, String iconUrl, Integer sortOrder) {
        StringBuilder sql = new StringBuilder("UPDATE categories SET ");
        boolean first = true;

        if (name != null && !name.isBlank()) {
            sql.append("name = ? ");
            first = false;
        }
        if (slug != null && !slug.isBlank()) {
            if (!first) sql.append(", ");
            sql.append("slug = ? ");
            first = false;
        }
        if (iconUrl != null) {
            if (!first) sql.append(", ");
            sql.append("icon_url = ? ");
            first = false;
        }
        if (sortOrder != null) {
            if (!first) sql.append(", ");
            sql.append("sort_order = ? ");
            first = false;
        }

        if (first) return;

        sql.append("WHERE id = ?");

        java.util.List<Object> params = new java.util.ArrayList<>();
        if (name != null && !name.isBlank()) params.add(name);
        if (slug != null && !slug.isBlank()) params.add(slug);
        if (iconUrl != null) params.add(iconUrl);
        if (sortOrder != null) params.add(sortOrder);
        params.add(id);

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    public void delete(Long id) {
        // Tách gỡ liên kết category_id ở bảng pois trước để không bị lỗi khoá ngoại
        jdbcTemplate.update("UPDATE pois SET category_id = NULL WHERE category_id = ?", id);
        jdbcTemplate.update("DELETE FROM categories WHERE id = ?", id);
    }
}
