package com.example.tourism.admin.repository;

import com.example.tourism.admin.dto.AdminDishResponse;
import com.example.tourism.admin.dto.CreateAdminDishRequest;
import com.example.tourism.admin.dto.UpdateAdminDishRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class AdminMenuRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminMenuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AdminDishResponse> adminDishRowMapper = (rs, rowNum) -> {
        String ingStr = rs.getString("ingredients");
        List<String> ingredients = (ingStr != null && !ingStr.isBlank())
                ? Arrays.stream(ingStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : Collections.emptyList();

        String allStr = rs.getString("allergens");
        List<String> allergens = (allStr != null && !allStr.isBlank())
                ? Arrays.stream(allStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : Collections.emptyList();

        return new AdminDishResponse(
                rs.getLong("id"),
                rs.getLong("poi_id"),
                rs.getString("poi_name"),
                (Long) rs.getObject("menu_category_id"),
                rs.getString("category_name"),
                rs.getString("name"),
                rs.getString("slug"),
                rs.getString("description"),
                rs.getInt("price"),
                (Integer) rs.getObject("original_price"),
                rs.getString("unit") != null ? rs.getString("unit") : "phần",
                rs.getBoolean("is_signature"),
                rs.getObject("is_available") != null ? rs.getBoolean("is_available") : true,
                rs.getString("thumbnail_url"),
                ingredients,
                allergens,
                rs.getBoolean("has_peanuts"),
                rs.getBoolean("has_seafood"),
                rs.getBoolean("has_gluten"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getTimestamp("updated_at").toLocalDateTime()
        );
    };

    public Optional<String> findPoiNameById(Long poiId) {
        String sql = "SELECT name FROM pois WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, String.class, poiId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Long findOrCreateMenuCategory(Long poiId, String categoryName) {
        if (categoryName == null || categoryName.trim().isBlank()) {
            categoryName = "Món chính";
        }
        String cleanName = categoryName.trim();

        String selectSql = "SELECT id FROM menu_categories WHERE poi_id = ? AND LOWER(name) = LOWER(?) LIMIT 1";
        List<Long> ids = jdbcTemplate.query(selectSql, (rs, rowNum) -> rs.getLong("id"), poiId, cleanName);
        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        String insertSql = """
                INSERT INTO menu_categories (poi_id, name, sort_order)
                VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menu_categories WHERE poi_id = ?))
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(insertSql, Long.class, poiId, cleanName, poiId);
    }

    public Long insertDish(Long poiId, Long menuCategoryId, CreateAdminDishRequest req,
                           String slug, boolean hasSeafood, boolean hasPeanuts, boolean hasGluten) {
        String sql = """
                INSERT INTO dishes (
                    poi_id, menu_category_id, name, slug, description, price, original_price,
                    unit, is_signature, thumbnail_url, allergens,
                    has_peanuts, has_seafood, has_gluten, is_available,
                    sort_order, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, true,
                    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM dishes WHERE poi_id = ?), now(), now()
                )
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                poiId,
                menuCategoryId,
                req.name().trim(),
                slug,
                req.description(),
                req.price() != null ? req.price() : 0,
                req.originalPrice(),
                req.unit() != null && !req.unit().isBlank() ? req.unit() : "phần",
                Boolean.TRUE.equals(req.isSignature()),
                req.imageUrl(),
                req.allergens(),
                hasPeanuts,
                hasSeafood,
                hasGluten,
                poiId
        );
    }

    public void insertDishImage(Long dishId, String url, String caption, boolean isCloseUp, int sortOrder) {
        String sql = "INSERT INTO dish_images (dish_id, url, caption, is_close_up, sort_order) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, dishId, url, caption, isCloseUp, sortOrder);
    }

    public Optional<AdminDishResponse> findDishById(Long dishId) {
        String sql = """
                SELECT d.id, d.poi_id, p.name AS poi_name, d.menu_category_id, mc.name AS category_name,
                       d.name, d.slug, d.description, d.price, d.original_price, d.unit,
                       d.is_signature, d.is_available, d.thumbnail_url, d.ingredients, d.allergens,
                       d.has_peanuts, d.has_seafood, d.has_gluten, d.created_at, d.updated_at
                FROM dishes d
                JOIN pois p ON d.poi_id = p.id
                LEFT JOIN menu_categories mc ON d.menu_category_id = mc.id
                WHERE d.id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, adminDishRowMapper, dishId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void updateDish(Long dishId, UpdateAdminDishRequest req, Long menuCategoryId,
                           Boolean hasSeafood, Boolean hasPeanuts, Boolean hasGluten) {
        StringBuilder sql = new StringBuilder("UPDATE dishes SET updated_at = now()");

        if (req.name() != null) sql.append(", name = '").append(req.name().replace("'", "''")).append("'");
        if (req.description() != null) sql.append(", description = '").append(req.description().replace("'", "''")).append("'");
        if (req.price() != null) sql.append(", price = ").append(req.price());
        if (req.originalPrice() != null) sql.append(", original_price = ").append(req.originalPrice());
        if (req.unit() != null) sql.append(", unit = '").append(req.unit().replace("'", "''")).append("'");
        if (req.isSignature() != null) sql.append(", is_signature = ").append(req.isSignature());
        if (req.isAvailable() != null) sql.append(", is_available = ").append(req.isAvailable());
        if (req.allergens() != null) sql.append(", allergens = '").append(req.allergens().replace("'", "''")).append("'");
        if (req.imageUrl() != null) sql.append(", thumbnail_url = '").append(req.imageUrl().replace("'", "''")).append("'");
        if (menuCategoryId != null) sql.append(", menu_category_id = ").append(menuCategoryId);

        if (hasSeafood != null) sql.append(", has_seafood = ").append(hasSeafood);
        if (hasPeanuts != null) sql.append(", has_peanuts = ").append(hasPeanuts);
        if (hasGluten != null) sql.append(", has_gluten = ").append(hasGluten);

        sql.append(" WHERE id = ").append(dishId);
        jdbcTemplate.update(sql.toString());
    }

    public void deleteDish(Long dishId) {
        jdbcTemplate.update("DELETE FROM dishes WHERE id = ?", dishId);
    }
}

