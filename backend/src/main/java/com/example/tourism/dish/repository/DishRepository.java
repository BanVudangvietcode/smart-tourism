package com.example.tourism.dish.repository;

import com.example.tourism.dish.model.Dish;
import com.example.tourism.dish.model.DishImage;
import com.example.tourism.dish.model.MenuCategory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DishRepository {

    private final JdbcTemplate jdbcTemplate;

    public DishRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<MenuCategory> categoryRowMapper = (rs, rowNum) -> {
        MenuCategory c = new MenuCategory();
        c.setId(rs.getLong("id"));
        c.setPoiId((Long) rs.getObject("poi_id"));
        c.setName(rs.getString("name"));
        c.setSortOrder(rs.getInt("sort_order"));
        c.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return c;
    };

    private final RowMapper<Dish> dishRowMapper = (rs, rowNum) -> {
        Dish d = new Dish();
        d.setId(rs.getLong("id"));
        d.setPoiId(rs.getLong("poi_id"));
        d.setMenuCategoryId((Long) rs.getObject("menu_category_id"));
        d.setMenuCategoryName(rs.getString("category_name"));
        d.setName(rs.getString("name"));
        d.setSlug(rs.getString("slug"));
        d.setDescription(rs.getString("description"));
        d.setPrice(rs.getInt("price"));
        d.setOriginalPrice((Integer) rs.getObject("original_price"));
        d.setUnit(rs.getString("unit"));
        d.setSignature(rs.getBoolean("is_signature"));
        d.setThumbnailUrl(rs.getString("thumbnail_url"));
        d.setIngredients(rs.getString("ingredients"));
        d.setAllergens(rs.getString("allergens"));
        d.setHasPeanuts(rs.getBoolean("has_peanuts"));
        d.setHasSeafood(rs.getBoolean("has_seafood"));
        d.setHasGluten(rs.getBoolean("has_gluten"));
        try {
            d.setAvailable(rs.getObject("is_available") != null ? rs.getBoolean("is_available") : true);
        } catch (Exception ignored) {
            d.setAvailable(true);
        }
        d.setSortOrder(rs.getInt("sort_order"));
        d.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        d.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return d;
    };

    private final RowMapper<DishImage> imageRowMapper = (rs, rowNum) -> {
        DishImage img = new DishImage();
        img.setId(rs.getLong("id"));
        img.setDishId(rs.getLong("dish_id"));
        img.setUrl(rs.getString("url"));
        img.setCaption(rs.getString("caption"));
        img.setCloseUp(rs.getBoolean("is_close_up"));
        img.setSortOrder(rs.getInt("sort_order"));
        return img;
    };

    public List<MenuCategory> findCategoriesByPoiId(Long poiId) {
        String sql = """
                SELECT id, poi_id, name, sort_order, created_at
                FROM menu_categories
                WHERE poi_id = ?
                ORDER BY sort_order ASC, id ASC
                """;
        return jdbcTemplate.query(sql, categoryRowMapper, poiId);
    }

    public List<Dish> findDishesByPoiId(Long poiId) {
        String sql = """
                SELECT d.id, d.poi_id, d.menu_category_id, mc.name AS category_name,
                       d.name, d.slug, d.description, d.price, d.original_price, d.unit,
                       d.is_signature, d.thumbnail_url, d.ingredients,
                       d.allergens, d.has_peanuts, d.has_seafood, d.has_gluten,
                       d.sort_order, d.created_at, d.updated_at
                FROM dishes d
                LEFT JOIN menu_categories mc ON d.menu_category_id = mc.id
                WHERE d.poi_id = ?
                ORDER BY COALESCE(mc.sort_order, 999) ASC, d.sort_order ASC, d.id ASC
                """;
        return jdbcTemplate.query(sql, dishRowMapper, poiId);
    }

    public Optional<Dish> findDishById(Long dishId) {
        String sql = """
                SELECT d.id, d.poi_id, d.menu_category_id, mc.name AS category_name,
                       d.name, d.slug, d.description, d.price, d.original_price, d.unit,
                       d.is_signature, d.thumbnail_url, d.ingredients,
                       d.allergens, d.has_peanuts, d.has_seafood, d.has_gluten,
                       d.sort_order, d.created_at, d.updated_at
                FROM dishes d
                LEFT JOIN menu_categories mc ON d.menu_category_id = mc.id
                WHERE d.id = ?
                """;
        List<Dish> results = jdbcTemplate.query(sql, dishRowMapper, dishId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<DishImage> findImagesByDishId(Long dishId) {
        String sql = """
                SELECT id, dish_id, url, caption, is_close_up, sort_order
                FROM dish_images
                WHERE dish_id = ?
                ORDER BY sort_order ASC, id ASC
                """;
        return jdbcTemplate.query(sql, imageRowMapper, dishId);
    }

    public Optional<String> findPoiNameById(Long poiId) {
        String sql = "SELECT name FROM pois WHERE id = ?";
        try {
            String name = jdbcTemplate.queryForObject(sql, String.class, poiId);
            return Optional.ofNullable(name);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
