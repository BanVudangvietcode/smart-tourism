package com.example.tourism.ai.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class AiContextRepository {

    private final JdbcTemplate jdbcTemplate;

    public AiContextRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static class PoiDetailContext {
        public Long id;
        public String name;
        public String description;
        public String address;
        public String openingHours;
        public Integer priceMin;
        public Integer priceMax;
        public Double rating;
        public Double lat;
        public Double lng;
        public String audioTranscript;
        public List<DishSummary> dishes = new ArrayList<>();
    }

    public static class DishSummary {
        public Long id;
        public Long poiId;
        public String poiName;
        public String name;
        public String description;
        public Integer price;
        public String unit;
        public Boolean isSignature;
        public String thumbnailUrl;
        public String ingredients;
        public String allergens;
        public Boolean hasPeanuts;
        public Boolean hasSeafood;
        public Boolean hasGluten;
        public Double distanceMeters;
    }

    public Optional<PoiDetailContext> findPoiContext(Long poiId, Double userLat, Double userLng) {
        String poiSql = """
            SELECT p.id, p.name, p.description, p.address, p.opening_hours,
                   p.price_range_min, p.price_range_max, p.avg_rating,
                   ST_Y(p.location::geometry) AS lat,
                   ST_X(p.location::geometry) AS lng,
                   a.transcript AS audio_transcript
            FROM pois p
            LEFT JOIN poi_audios a ON p.id = a.poi_id
            WHERE p.id = ?
            """;

        List<PoiDetailContext> list = jdbcTemplate.query(poiSql, (rs, rowNum) -> {
            PoiDetailContext c = new PoiDetailContext();
            c.id = rs.getLong("id");
            c.name = rs.getString("name");
            c.description = rs.getString("description");
            c.address = rs.getString("address");
            c.openingHours = rs.getString("opening_hours");
            c.priceMin = (Integer) rs.getObject("price_range_min");
            c.priceMax = (Integer) rs.getObject("price_range_max");
            c.rating = rs.getDouble("avg_rating");
            c.lat = rs.getDouble("lat");
            c.lng = rs.getDouble("lng");
            c.audioTranscript = rs.getString("audio_transcript");
            return c;
        }, poiId);

        if (list.isEmpty()) {
            return Optional.empty();
        }

        PoiDetailContext context = list.get(0);

        String dishesSql = """
            SELECT id, poi_id, name, description, price, unit, is_signature,
                   thumbnail_url, ingredients, allergens, has_peanuts, has_seafood, has_gluten
            FROM dishes
            WHERE poi_id = ?
            ORDER BY is_signature DESC, sort_order ASC
            """;

        context.dishes = jdbcTemplate.query(dishesSql, (rs, rowNum) -> {
            DishSummary d = new DishSummary();
            d.id = rs.getLong("id");
            d.poiId = rs.getLong("poi_id");
            d.poiName = context.name;
            d.name = rs.getString("name");
            d.description = rs.getString("description");
            d.price = rs.getInt("price");
            d.unit = rs.getString("unit");
            d.isSignature = rs.getBoolean("is_signature");
            d.thumbnailUrl = rs.getString("thumbnail_url");
            d.ingredients = rs.getString("ingredients");
            d.allergens = rs.getString("allergens");
            d.hasPeanuts = rs.getBoolean("has_peanuts");
            d.hasSeafood = rs.getBoolean("has_seafood");
            d.hasGluten = rs.getBoolean("has_gluten");
            return d;
        }, poiId);

        return Optional.of(context);
    }

    public List<DishSummary> findCandidateDishes(Double userLat, Double userLng) {
        boolean hasLocation = userLat != null && userLng != null;
        String sql;
        Object[] params;

        if (hasLocation) {
            sql = """
                SELECT d.id, d.poi_id, p.name AS poi_name, d.name, d.description,
                       d.price, d.unit, d.is_signature, d.thumbnail_url,
                       d.ingredients, d.allergens, d.has_peanuts, d.has_seafood, d.has_gluten,
                       ST_Distance(p.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters
                FROM dishes d
                JOIN pois p ON d.poi_id = p.id
                ORDER BY d.is_signature DESC, d.price ASC
                """;
            params = new Object[]{userLng, userLat};
        } else {
            sql = """
                SELECT d.id, d.poi_id, p.name AS poi_name, d.name, d.description,
                       d.price, d.unit, d.is_signature, d.thumbnail_url,
                       d.ingredients, d.allergens, d.has_peanuts, d.has_seafood, d.has_gluten,
                       NULL::float8 AS distance_meters
                FROM dishes d
                JOIN pois p ON d.poi_id = p.id
                ORDER BY d.is_signature DESC, d.price ASC
                """;
            params = new Object[]{};
        }

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DishSummary d = new DishSummary();
            d.id = rs.getLong("id");
            d.poiId = rs.getLong("poi_id");
            d.poiName = rs.getString("poi_name");
            d.name = rs.getString("name");
            d.description = rs.getString("description");
            d.price = rs.getInt("price");
            d.unit = rs.getString("unit");
            d.isSignature = rs.getBoolean("is_signature");
            d.thumbnailUrl = rs.getString("thumbnail_url");
            d.ingredients = rs.getString("ingredients");
            d.allergens = rs.getString("allergens");
            d.hasPeanuts = rs.getBoolean("has_peanuts");
            d.hasSeafood = rs.getBoolean("has_seafood");
            d.hasGluten = rs.getBoolean("has_gluten");
            d.distanceMeters = rs.getObject("distance_meters") != null ? rs.getDouble("distance_meters") : null;
            return d;
        }, params);
    }
}

