package com.example.tourism.ai.service;

import com.example.tourism.ai.dto.*;
import com.example.tourism.ai.repository.AiContextRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiContextRepository contextRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public AiService(AiContextRepository contextRepository, GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.contextRepository = contextRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public AiAskResponse askPoi(AiAskRequest request) {
        if (request.getPoiId() == null) {
            throw new IllegalArgumentException("poiId không được để trống.");
        }
        if (request.getQuestion() == null || request.getQuestion().trim().isBlank()) {
            throw new IllegalArgumentException("question không được để trống.");
        }

        AiContextRepository.PoiDetailContext poi = contextRepository
                .findPoiContext(request.getPoiId(), request.getUserLat(), request.getUserLng())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm quán ăn với ID: " + request.getPoiId()));

        final Double distanceMeters = (request.getUserLat() != null && request.getUserLng() != null && poi.lat != null && poi.lng != null)
                ? calculateHaversine(request.getUserLat(), request.getUserLng(), poi.lat, poi.lng)
                : null;

        final String conversationId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : UUID.randomUUID().toString();


        String systemPrompt = buildAskSystemPrompt(poi, distanceMeters);
        String userPrompt = request.getQuestion().trim();

        String answer = geminiClient.generateText(systemPrompt, userPrompt)
                .orElseGet(() -> generateFallbackAnswer(poi, userPrompt, distanceMeters));

        List<String> followUps = generateFollowUps(poi);

        return new AiAskResponse(answer, poi.id, poi.name, conversationId, distanceMeters, followUps);
    }

    public AiRecommendDishResponse recommendDishes(AiRecommendDishRequest request) {
        int budget = (request.getBudget() != null && request.getBudget() > 0) ? request.getBudget() : 100000;
        int groupSize = (request.getGroupSize() != null && request.getGroupSize() > 0) ? request.getGroupSize() : 1;
        List<String> tastePreferences = request.getTastePreferences() != null ? request.getTastePreferences() : new ArrayList<>();

        List<AiContextRepository.DishSummary> candidates = contextRepository.findCandidateDishes(
                request.getUserLat(), request.getUserLng()
        );

        String systemPrompt = buildRecommendSystemPrompt();
        String userPrompt = buildRecommendUserPrompt(candidates, budget, groupSize, tastePreferences, request.getUserLat(), request.getUserLng());

        Optional<String> jsonResponse = geminiClient.generateJson(systemPrompt, userPrompt);

        if (jsonResponse.isPresent()) {
            try {
                AiRecommendDishResponse parsed = parseRecommendResponse(jsonResponse.get(), candidates);
                if (parsed != null && !parsed.getDishes().isEmpty()) {
                    return parsed;
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini recommendation JSON: {}. Using fallback selector.", e.getMessage());
            }
        }

        return generateFallbackRecommendations(candidates, budget, groupSize, tastePreferences);
    }

    // ─── HELPER METHODS ──────────────────────────────────────────────

    private String buildAskSystemPrompt(AiContextRepository.PoiDetailContext poi, Double distanceMeters) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là Trợ lý Ảo Du Lịch & Ẩm Thực Thông Minh của Phố Ẩm Thực Quận 4, TP.HCM.\n");
        sb.append("Phong cách: Thân thiện, hào sảng, hiếu khách đúng chất người Sài Gòn, am hiểu ẩm thực sâu sắc và trả lời cô đọng, hữu ích.\n");
        sb.append("Dưới đây là dữ liệu thực tế đã được xác thực về quán ăn:\n");
        sb.append("- Tên quán: ").append(poi.name).append("\n");
        sb.append("- Địa chỉ: ").append(poi.address).append("\n");
        sb.append("- Giờ mở cửa: ").append(poi.openingHours).append("\n");
        sb.append("- Giá trung bình: ").append(poi.priceMin).append("đ - ").append(poi.priceMax).append("đ\n");
        sb.append("- Đánh giá: ").append(poi.rating).append(" sao\n");

        if (distanceMeters != null) {
            sb.append(String.format(Locale.US, "- Khoảng cách hiện tại của du khách đến quán: %.0f mét\n", distanceMeters));
        }

        if (poi.audioTranscript != null && !poi.audioTranscript.isBlank()) {
            sb.append("- Thuyết minh văn hóa & lịch sử quán:\n").append(poi.audioTranscript).append("\n");
        }

        sb.append("- Thực đơn tiêu biểu của quán:\n");
        for (AiContextRepository.DishSummary d : poi.dishes) {
            sb.append(String.format("  * %s (Giá: %,d %s)%s - Thành phần: %s. Cảnh báo dị ứng: %s\n",
                    d.name, d.price, d.unit, (d.isSignature ? " [BEST-SELLER]" : ""),
                    d.ingredients != null ? d.ingredients : "Tiêu chuẩn",
                    d.allergens != null ? d.allergens : "Không"));
        }

        sb.append("\nQuy tắc trả lời:\n");
        sb.append("1. Trả lời trực tiếp vào trọng tâm câu hỏi của du khách.\n");
        sb.append("2. Khéo léo nhắc đến các món signature đặc sắc hoặc mẹo ăn ngon nếu liên quan.\n");
        sb.append("3. Nếu du khách hỏi về dị ứng, hãy căn cứ chính xác vào thông tin dị ứng được cung cấp.\n");
        return sb.toString();
    }

    private String generateFallbackAnswer(AiContextRepository.PoiDetailContext poi, String question, Double distanceMeters) {
        String qLower = question.toLowerCase(Locale.ROOT);

        if (qLower.contains("mở cửa") || qLower.contains("giờ")) {
            return String.format("%s mở cửa vào khung giờ: %s. Bạn nên đến sớm một chút vào buổi tối để chọn được chỗ ngồi ưng ý nhé!",
                    poi.name, poi.openingHours);
        }

        if (qLower.contains("ngon nhất") || qLower.contains("đặc biệt") || qLower.contains("signature") || qLower.contains("thử")) {
            List<String> signatures = poi.dishes.stream()
                    .filter(d -> Boolean.TRUE.equals(d.isSignature))
                    .map(d -> String.format("%s (%,d %s)", d.name, d.price, d.unit))
                    .toList();
            if (!signatures.isEmpty()) {
                return String.format("Món 'đỉnh chóp' nức tiếng của %s nhất định bạn phải thử là: %s. Nước sốt đậm đà chấm cùng bánh mì giòn rụm là trải nghiệm tuyệt vời nhất!",
                        poi.name, String.join(", ", signatures));
            }
        }

        if (qLower.contains("dị ứng") || qLower.contains("đậu phộng") || qLower.contains("hải sản")) {
            return String.format("Tại %s, các món ốc và hải sản có thể chứa dị ứng hải sản, đậu phộng rang hoặc bơ sữa. Quý khách vui lòng dặn trước nhân viên quán khi gọi món để được phục vụ chu đáo nhất nhé!", poi.name);
        }

        return String.format("Chào bạn! %s tọa lạc tại %s (%s). Quán nổi tiếng với ẩm thực đường phố đặc trưng Quận 4. %s Bạn có muốn xem thêm chi tiết món nào không?",
                poi.name, poi.address, poi.openingHours,
                (poi.description != null ? poi.description : ""));
    }

    private List<String> generateFollowUps(AiContextRepository.PoiDetailContext poi) {
        List<String> list = new ArrayList<>();
        list.add("Món nào là Best-seller nên thử nhất?");
        list.add("Quán mở cửa đến mấy giờ?");
        list.add("Có món nào không cay cho người không ăn được cay?");
        return list;
    }

    private String buildRecommendSystemPrompt() {
        return """
            Bạn là Chuyên Gia Tư Vấn Ẩm Thực Thông Minh của Quận 4, TP.HCM.
            Nhiệm vụ của bạn là chọn đúng 3 món ăn phù hợp nhất từ danh sách các món trong hệ thống dựa trên:
            1. Tổng ngân sách tối đa của du khách.
            2. Số lượng người trong nhóm.
            3. Sở thích khẩu vị (cay, hải sản, ăn vặt, thanh mát,...).
            4. Vị trí gần nhất của du khách.

            BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU:
            {
              "summary": "Tóm tắt ngắn gọn lý do chọn combo này (1-2 câu hào sảng, hấp dẫn)",
              "totalEstimatedPrice": 95000,
              "budgetRemaining": 5000,
              "tips": "Mẹo ăn ngon hữu ích (vd: gọi thêm bánh mì nóng chấm sốt)",
              "dishes": [
                {
                  "dishId": 1,
                  "dishName": "Tên món",
                  "poiId": 1,
                  "poiName": "Tên quán",
                  "price": 65000,
                  "unit": "phần",
                  "imageUrl": "url ảnh",
                  "isSignature": true,
                  "reason": "Lý do món này cực kỳ hợp với ngân sách và khẩu vị"
                }
              ]
            }
            """;
    }

    private String buildRecommendUserPrompt(List<AiContextRepository.DishSummary> candidates,
                                            int budget, int groupSize, List<String> tastePreferences,
                                            Double userLat, Double userLng) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Yêu cầu của khách: Ngân sách: %,d đ, Số người: %d, Khẩu vị: %s\n",
                budget, groupSize, tastePreferences.isEmpty() ? "Đa dạng" : String.join(", ", tastePreferences)));

        sb.append("Danh sách các món ăn có sẵn trong hệ thống:\n");
        for (AiContextRepository.DishSummary d : candidates) {
            sb.append(String.format("ID:%d | Tên: %s | Quán: %s (POI ID: %d) | Giá: %,d đ/%s | BestSeller: %s | Cay/Hải sản: %s | Dị ứng: %s | Ảnh: %s\n",
                    d.id, d.name, d.poiName, d.poiId, d.price, d.unit,
                    d.isSignature ? "Có" : "Không",
                    (Boolean.TRUE.equals(d.hasSeafood) ? "Hải sản " : "") + (d.description != null && d.description.contains("cay") ? "Cay" : ""),
                    d.allergens != null ? d.allergens : "Không",
                    d.thumbnailUrl != null ? d.thumbnailUrl : ""));
        }
        sb.append("\nHãy chọn ra đúng 3 món ăn tối ưu nhất có tổng giá không vượt quá ngân sách!");
        return sb.toString();
    }

    private AiRecommendDishResponse parseRecommendResponse(String json, List<AiContextRepository.DishSummary> candidates) {
        try {
            String cleanJson = extractJson(json);
            JsonNode root = objectMapper.readTree(cleanJson);
            AiRecommendDishResponse res = new AiRecommendDishResponse();
            res.setSummary(root.path("summary").asText("Gợi ý combo ẩm thực tuyệt vời dành cho bạn tại Quận 4!"));
            res.setTotalEstimatedPrice(root.path("totalEstimatedPrice").asInt(0));
            res.setBudgetRemaining(root.path("budgetRemaining").asInt(0));
            res.setTips(root.path("tips").asText("Nên dùng kèm trà đá hoặc nước ngọt để bữa ăn trọn vị hơn!"));

            Map<Long, AiContextRepository.DishSummary> map = candidates.stream()
                    .collect(Collectors.toMap(c -> c.id, c -> c, (a, b) -> a));

            List<RecommendedDishItem> list = new ArrayList<>();
            JsonNode dishesNode = root.path("dishes");
            if (dishesNode.isArray()) {
                for (JsonNode n : dishesNode) {
                    Long dishId = n.path("dishId").asLong();
                    AiContextRepository.DishSummary orig = map.get(dishId);

                    RecommendedDishItem item = new RecommendedDishItem();
                    item.setDishId(dishId);
                    item.setDishName(n.path("dishName").asText(orig != null ? orig.name : ""));
                    item.setPoiId(n.path("poiId").asLong(orig != null ? orig.poiId : 1L));
                    item.setPoiName(n.path("poiName").asText(orig != null ? orig.poiName : ""));
                    item.setPrice(n.path("price").asInt(orig != null ? orig.price : 0));
                    item.setUnit(n.path("unit").asText(orig != null ? orig.unit : "phần"));
                    item.setImageUrl(n.path("imageUrl").asText(orig != null ? orig.thumbnailUrl : ""));
                    item.setIsSignature(n.path("isSignature").asBoolean(orig != null && Boolean.TRUE.equals(orig.isSignature)));
                    item.setReason(n.path("reason").asText("Món ăn hài hòa khẩu vị và phù hợp túi tiền của bạn."));

                    list.add(item);
                }
            }
            res.setDishes(list);
            return res;
        } catch (Exception e) {
            log.warn("Error parsing Gemini JSON: {}", e.getMessage());
            return null;
        }
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }


    private AiRecommendDishResponse generateFallbackRecommendations(List<AiContextRepository.DishSummary> candidates,
                                                                    int budget, int groupSize, List<String> tastePreferences) {
        List<AiContextRepository.DishSummary> sorted = new ArrayList<>(candidates);

        // Ưu tiên món theo khẩu vị
        sorted.sort((d1, d2) -> {
            boolean p1Matches = matchesPreferences(d1, tastePreferences);
            boolean p2Matches = matchesPreferences(d2, tastePreferences);
            if (p1Matches != p2Matches) {
                return p1Matches ? -1 : 1;
            }
            if (d1.isSignature != d2.isSignature) {
                return Boolean.TRUE.equals(d1.isSignature) ? -1 : 1;
            }
            return Integer.compare(d1.price, d2.price);
        });

        List<RecommendedDishItem> chosen = new ArrayList<>();
        int currentTotal = 0;

        for (AiContextRepository.DishSummary d : sorted) {
            if (chosen.size() >= 3) break;
            if (currentTotal + d.price <= budget) {
                chosen.add(new RecommendedDishItem(
                        d.id, d.name, d.poiId, d.poiName, d.price, d.unit,
                        d.thumbnailUrl, d.isSignature,
                        String.format("Món ngon đặc sắc của %s, phù hợp ngân sách và khẩu vị yêu thích.", d.poiName)
                ));
                currentTotal += d.price;
            }
        }

        // Nếu chưa đủ 3 món, tìm thêm các món có giá vừa với ngân sách còn lại
        if (chosen.size() < 3) {
            for (AiContextRepository.DishSummary d : sorted) {
                if (chosen.size() >= 3) break;
                if (chosen.stream().noneMatch(c -> c.getDishId().equals(d.id))) {
                    if (currentTotal + d.price <= budget || chosen.isEmpty()) {
                        chosen.add(new RecommendedDishItem(
                                d.id, d.name, d.poiId, d.poiName, d.price, d.unit,
                                d.thumbnailUrl, d.isSignature,
                                "Món ăn kèm thanh mát giúp cân bằng hương vị bữa ăn."
                        ));
                        currentTotal += d.price;
                    }
                }
            }
        }


        int remaining = Math.max(0, budget - currentTotal);
        String summary = String.format("Gợi ý combo 3 món ăn chuẩn vị Quận 4 cho %d người với ngân sách %,d đ.",
                groupSize, budget);
        String tips = "Bạn có thể gọi thêm bánh mì nóng giòn để chấm nước sốt béo ngậy!";

        return new AiRecommendDishResponse(summary, currentTotal, remaining, chosen, tips);
    }

    private boolean matchesPreferences(AiContextRepository.DishSummary d, List<String> preferences) {
        if (preferences == null || preferences.isEmpty()) return true;
        for (String p : preferences) {
            String pLower = p.toLowerCase(Locale.ROOT);
            if (pLower.contains("hải sản") && Boolean.TRUE.equals(d.hasSeafood)) return true;
            if (pLower.contains("cay") && d.description != null && d.description.toLowerCase().contains("cay")) return true;
            if (pLower.contains("béo") && d.description != null && (d.description.contains("béo") || d.description.contains("bơ"))) return true;
        }
        return false;
    }

    private double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Radius of Earth in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }
}
