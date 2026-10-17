package com.example.tourism.ai.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * Repository cung cấp "ngữ cảnh" (Context Provider) cho hệ thống AI.
 * 
 * Nhiệm vụ chính:
 * 1. Truy vấn thông tin chi tiết của quán ăn (địa chỉ, giờ mở cửa, bài thuyết minh audio, thực đơn, dị ứng)
 *    để "bơm" (inject) vào prompt cho AI trả lời câu hỏi của khách (RAG - Retrieval-Augmented Generation).
 * 2. Lấy danh sách các món ăn kèm khoảng cách địa lý thực tế (PostGIS) để AI gợi ý combo 3 món tối ưu ngân sách.
 */
@Repository
public class AiContextRepository {

    private final JdbcTemplate jdbcTemplate;

    public AiContextRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // =========================================================================
    // DTOs NỘI BỘ (Chứa dữ liệu chuẩn bị gửi cho AI Prompt)
    // =========================================================================

    /**
     * Dữ liệu ngữ cảnh toàn diện của 1 quán ăn, dùng để inject vào System Prompt của API /ai/ask.
     */
    public static class PoiDetailContext {
        public Long id;
        public String name;
        public String poiType;             // 'FOOD', 'LANDMARK', 'RELIGIOUS', 'HISTORICAL'
        public String description;
        public String address;
        public String openingHours;
        public Integer priceMin;
        public Integer priceMax;
        public Double rating;
        public Double lat;                  // Vĩ độ (Y)
        public Double lng;                  // Kinh độ (X)
        public String audioTranscript;      // Kịch bản bài thuyết minh âm thanh (chứa thông tin văn hóa/lịch sử)
        public List<DishSummary> dishes = new ArrayList<>(); // Toàn bộ thực đơn của quán
    }

    /**
     * Tóm tắt thông tin một món ăn, kèm thông tin quán và cảnh báo dị ứng.
     */
    public static class DishSummary {
        public Long id;
        public Long poiId;
        public String poiName;
        public String name;
        public String description;
        public Integer price;
        public String unit;                 // Đơn vị tính: dĩa, phần, ly, lon...
        public Boolean isSignature;         // true nếu là món Best-seller / món đỉnh chóp
        public String thumbnailUrl;
        public String ingredients;          // Thành phần nguyên liệu chính
        public String allergens;            // Chuỗi cảnh báo dị ứng chi tiết
        public Boolean hasPeanuts;          // Cờ cảnh báo dị ứng đậu phộng
        public Boolean hasSeafood;          // Cờ cảnh báo dị ứng hải sản
        public Boolean hasGluten;           // Cờ cảnh báo dị ứng gluten/bột mì
        public Double distanceMeters;       // Khoảng cách từ khách đến quán (mét)
    }

    // =========================================================================
    // PHƯƠNG THỨC TRUY VẤN DỮ LIỆU
    // =========================================================================

    /**
     * Lấy toàn bộ ngữ cảnh của 1 quán ăn (thông tin chung + thuyết minh audio + thực đơn).
     * Phục vụ cho API: POST /api/v1/ai/ask
     *
     * @param poiId   ID quán ăn cần hỏi
     * @param userLat Vĩ độ hiện tại của du khách (có thể null)
     * @param userLng Kinh độ hiện tại của du khách (có thể null)
     * @return PoiDetailContext gói gọn dữ liệu để xây dựng AI prompt
     */
    public Optional<PoiDetailContext> findPoiContext(Long poiId, Double userLat, Double userLng) {
        // BƯỚC 1: Lấy thông tin quán ăn + nối (LEFT JOIN) bài thuyết minh audio nếu có
        // ST_X/ST_Y: Chuyển dữ liệu không gian PostGIS sang tọa độ số thực (lng, lat)
        String poiSql = """
            SELECT p.id, p.name, p.poi_type, p.description, p.address, p.opening_hours,
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
            c.poiType = rs.getString("poi_type") != null ? rs.getString("poi_type") : "FOOD";
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

        // Nếu không tìm thấy quán ăn với ID này
        if (list.isEmpty()) {
            return Optional.empty();
        }

        PoiDetailContext context = list.get(0);

        // BƯỚC 2: Lấy danh sách món ăn của quán (ưu tiên món Best-seller lên đầu)
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

    /**
     * Lấy danh sách tất cả món ăn trong khu vực làm "ứng viên" (candidates) cho AI gợi ý.
     * Phục vụ cho API: POST /api/v1/ai/recommend-dish
     *
     * @param userLat Vĩ độ hiện tại của du khách (nếu có thì tính khoảng cách)
     * @param userLng Kinh độ hiện tại của du khách (nếu có thì tính khoảng cách)
     * @return Danh sách món ăn kèm khoảng cách đến quán, ưu tiên món Best-seller và giá hợp lý
     */
    public List<DishSummary> findCandidateDishes(Double userLat, Double userLng) {
        boolean hasLocation = userLat != null && userLng != null;
        String sql;
        Object[] params;

        if (hasLocation) {
            // Có vị trí GPS: Dùng hàm PostGIS ST_Distance tính khoảng cách thực tế (mét)
            // Chú ý: ST_MakePoint nhận (kinh độ userLng, vĩ độ userLat)
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
            // Không có GPS: Đặt distance_meters là NULL để tránh lỗi SQL
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

