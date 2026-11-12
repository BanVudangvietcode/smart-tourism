package com.example.tourism.ai.service;

import com.example.tourism.ai.dto.*;
import com.example.tourism.ai.repository.AiContextRepository;
import com.example.tourism.audio.service.TtsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiContextRepository contextRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final TtsService ttsService;
    private final Map<String, byte[]> voiceReplyCache = new ConcurrentHashMap<>();

    public AiService(AiContextRepository contextRepository, GeminiClient geminiClient, ObjectMapper objectMapper) {
        this(contextRepository, geminiClient, objectMapper, new TtsService());
    }

    @Autowired
    public AiService(AiContextRepository contextRepository,
                     GeminiClient geminiClient,
                     ObjectMapper objectMapper,
                     TtsService ttsService) {
        this.contextRepository = contextRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        this.ttsService = ttsService != null ? ttsService : new TtsService();
    }

    public AiAskResponse askPoi(AiAskRequest request) {
        return askPoi(request, "vi");
    }

    public AiAskResponse askPoi(AiAskRequest request, String lang) {
        if (request.getQuestion() == null || request.getQuestion().trim().isBlank()) {
            throw new IllegalArgumentException("Nội dung câu hỏi không được để trống.");
        }

        final boolean isEn = "en".equalsIgnoreCase(lang);

        final String conversationId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : UUID.randomUUID().toString();

        if (request.getPoiId() == null) {
            return askGeneral(request, conversationId, isEn);
        }

        AiContextRepository.PoiDetailContext poi = contextRepository
                .findPoiContext(request.getPoiId(), request.getUserLat(), request.getUserLng())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm quán ăn với ID: " + request.getPoiId()));

        final Double distanceMeters = (request.getUserLat() != null && request.getUserLng() != null && poi.lat != null && poi.lng != null)
                ? calculateHaversine(request.getUserLat(), request.getUserLng(), poi.lat, poi.lng)
                : null;

        String systemPrompt = buildAskSystemPrompt(poi, distanceMeters, isEn);
        String userPrompt = request.getQuestion().trim();

        String answer = geminiClient.generateText(systemPrompt, userPrompt)
                .orElseGet(() -> generateFallbackAnswer(poi, userPrompt, distanceMeters, isEn));

        List<String> followUps = generateFollowUps(poi, isEn);

        return new AiAskResponse(answer, poi.id, poi.name, conversationId, distanceMeters, followUps);
    }

    private AiAskResponse askGeneral(AiAskRequest request, String conversationId, boolean isEn) {
        String userPrompt = request.getQuestion().trim();
        String systemPrompt = isEn ? """
            You are the Virtual Tour Guide & AI Assistant of District 4, Ho Chi Minh City (Saigon Whispers).
            District 4 is an island-like vibrant district of Saigon, famous for:
            - Street food culture: Vinh Khanh Seafood Street, Ton Dan Food Street, Xom Chieu 200 Market.
            - Key landmarks:
              1. Oc Oanh (534 Vinh Khanh): Busiest seafood stall, famous for spicy roasted sea snails and grilled clams.
              2. Co Thao Beef Offal Stew (243/29G Ton Dan): Rich coconut milk broth with fresh bread.
              3. Thuan Hieu Herbal Duck Noodle (Hoang Dieu): Tender herbal duck leg with chewy egg noodles.
              4. Bai Rac Broken Rice (77 Le Van Linh): Famous late-night broken rice with succulent grilled pork ribs.
              5. Dragon Wharf - Ho Chi Minh Museum (01 Nguyen Tat Thanh): Historic landmark where President Ho Chi Minh departed in 1911.
              6. Mong Bridge: Turquoise historic 120-year-old iron bridge across Ben Nghe canal, ideal for sunset views.
              7. Kim Lien Pagoda (109 Doan Van Bo): Peaceful Mahayana Buddhist temple.
              8. Xom Chieu Church (Le Van Linh): 160-year-old historic church.
            Tone: Friendly, welcoming, knowledgeable, concise, and helpful.
            LANGUAGE REQUIREMENT: You MUST reply entirely in English.
            """ : """
            Bạn là Trợ lý Ảo Du Lịch & Hướng Dẫn Viên Thông Minh của Quận 4, TP. Hồ Chí Minh (Saigon Whispers).
            Quận 4 là một cù lao tam giác đặc biệt của Sài Gòn, nổi tiếng với:
            - Văn hóa ẩm thực đường phố sôi động: Phố ẩm thực Vĩnh Khánh (thánh địa các món ốc), Phố Tôn Đản, Chợ Xóm Chiếu (thiên đường ăn vặt).
            - Các địa điểm nổi bật trong hệ thống:
              1. Quán Ốc Oanh (534 Vĩnh Khánh): Quán ốc đông nhất, nổi tiếng ốc hương rang muối ớt, sò huyết nướng mọi.
              2. Quán Phá Lấu Bò Cô Thảo (243/29G Tôn Đản): Phá lấu nước dừa béo thơm chấm tắc ớt, ăn kèm bánh mì.
              3. Mì Vịt Tiềm Thuận Hiếu (Hoàng Diệu): Mì sợi dai, đùi vịt tiềm thảo mộc gia truyền mềm rục.
              4. Quán Cơm Tấm Bãi Rác (77 Lê Văn Linh): Cơm tấm đêm sườn non nướng, chả cua, thịt kho trứng lòng đào.
              5. Bến Nhà Rồng - Bảo tàng Hồ Chí Minh (01 Nguyễn Tất Thành): Di tích lịch sử nơi Bác Hồ ra đi tìm đường cứu nước năm 1911.
              6. Cầu Mống: Cây cầu sắt cổ bắc qua rạch Bến Nghé nối Quận 1 và Quận 4, điểm check-in hoàng hôn tuyệt đẹp.
              7. Chùa Kim Liên (109 Đoàn Văn Bơ): Ngôi chùa Phật giáo Bắc Tông thanh tịnh giữa lòng đô thị.
              8. Nhà thờ Xóm Chiếu (Lê Văn Linh): Nhà thờ cổ kính hơn 160 năm gắn bó với giáo dân Quận 4.
            Phong cách trả lời: Thân thiện, hào sảng, hiếu khách chuẩn người Sài Gòn, am hiểu sâu sắc, trả lời ngắn gọn, rành mạch và gợi mở các trải nghiệm tuyệt vời.
            """;

        String answer = geminiClient.generateText(systemPrompt, userPrompt)
                .orElseGet(() -> generateGeneralFallbackAnswer(userPrompt, isEn));

        List<String> followUps = isEn ? List.of(
                "Which snail stall is the best and busiest on Vinh Khanh?",
                "What days is Dragon Wharf open and how much is admission?",
                "Are there good late-night food spots on Ton Dan street?"
        ) : List.of(
                "Quán ốc nào ngon và đông khách nhất ở Vĩnh Khánh?",
                "Bến Nhà Rồng mở cửa những ngày nào và giá vé bao nhiêu?",
                "Có món ăn đêm nào ngon ở đường Tôn Đản không?"
        );

        return new AiAskResponse(answer, null, "Quận 4 - Saigon Whispers", conversationId, null, followUps);
    }

    private String generateGeneralFallbackAnswer(String prompt, boolean isEn) {
        String pLower = prompt.toLowerCase(Locale.ROOT);
        if (isEn) {
            if (pLower.contains("snail") || pLower.contains("seafood") || pLower.contains("vinh khanh") || pLower.contains("ốc")) {
                return "When visiting District 4, you definitely cannot miss **Vinh Khanh Seafood Street**! Most famous is **Oc Oanh** (534 Vinh Khanh) known for chili salt roasted sea snails and grilled blood clams. Open from 3 PM to 2 AM with a vibrant street atmosphere!";
            }
            if (pLower.contains("offal") || pLower.contains("pha lau") || pLower.contains("ton dan") || pLower.contains("phá lấu")) {
                return "The quintessential street specialty of District 4 is **Co Thao Beef Offal Stew** in alley 243 Ton Dan. Rich coconut milk broth, tender offal dipped in sweet-and-sour calamansi chili sauce, served with warm crispy bread!";
            }
            if (pLower.contains("history") || pLower.contains("dragon wharf") || pLower.contains("museum") || pLower.contains("bến nhà rồng")) {
                return "**Dragon Wharf (Ho Chi Minh Museum)** at 01 Nguyen Tat Thanh is a historic national landmark where young Nguyen Tat Thanh departed aboard an admiral ship in 1911. Open 7:30 - 11:30 and 13:30 - 17:00 (Tuesday to Sunday).";
            }
            if (pLower.contains("photo") || pLower.contains("mong bridge") || pLower.contains("cầu mống")) {
                return "For scenic skyline photos and sunsets over the Ben Nghe canal looking towards Bitexco, visit **Mong Bridge** - a turquoise historical iron bridge over 120 years old connecting District 1 and 4. Great river breezes in late afternoon!";
            }
            if (pLower.contains("night") || pLower.contains("late") || pLower.contains("broken rice") || pLower.contains("cơm tấm")) {
                return "District 4 night owls flock to **Bai Rac Broken Rice** (77 Le Van Linh behind Xom Chieu Market) open from 4:30 PM to 2 AM with succulent grilled pork ribs and egg meatloaf, or herbal duck noodle stalls along Hoang Dieu.";
            }
            return "Hello! I am your Saigon Whispers District 4 AI Travel Assistant. District 4 is famous for street food on **Vinh Khanh Seafood Street**, **Ton Dan Offal Stew**, **Xom Chieu Market**, as well as heritage landmarks like **Dragon Wharf** and **Mong Bridge**. Which spot or dish would you like to explore?";
        }

        if (pLower.contains("ốc") || pLower.contains("hải sản") || pLower.contains("vĩnh khánh")) {
            return "Nhắc đến Quận 4 thì chắc chắn phải ghé ngay **Phố Ốc Vĩnh Khánh**! Nổi tiếng nhất là **Quán Ốc Oanh** (534 Vĩnh Khánh) với món ốc hương rang muối ớt đậm đà thơm nức mũi, hoặc ghé Ốc Vũ, Ốc Đào. Các quán thường mở cửa từ 15h đến 2h sáng, không khí cực kỳ náo nhiệt!";
        }
        if (pLower.contains("phá lấu") || pLower.contains("tôn đản")) {
            return "Món ăn 'quốc hồn quốc túy' của Quận 4 chính là **Phá Lấu Bò Cô Thảo** tại hẻm 243 Tôn Đản. Nước lèo nấu từ nước cốt dừa béo ngậy, phá lấu giòn sần sật chấm cùng mắm tắc chua ngọt và bánh mì nóng giòn cực đỉnh!";
        }
        if (pLower.contains("lịch sử") || pLower.contains("bến nhà rồng") || pLower.contains("bảo tàng")) {
            return "**Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)** tại số 01 Nguyễn Tất Thành là chứng tích lịch sử thiêng liêng, nơi người thanh niên Nguyễn Tất Thành lên tàu ra đi tìm đường cứu nước năm 1911. Bảo tàng mở cửa từ 7h30 - 11h30 và 13h30 - 17h00 (từ thứ Ba đến Chủ Nhật).";
        }
        if (pLower.contains("chụp ảnh") || pLower.contains("check-in") || pLower.contains("cầu mống")) {
            return "Để chụp ảnh sống ảo và ngắm hoàng hôn Quận 4 nhìn sang Bitexco Quận 1, bạn nhất định phải ghé **Cầu Mống** - cây cầu sắt cổ màu xanh ngọc hơn 120 năm tuổi. Buổi chiều tối ngồi hóng gió sông Sài Gòn ở đây cực kỳ mát mẻ!";
        }
        if (pLower.contains("đêm") || pLower.contains("khuya") || pLower.contains("cơm tấm")) {
            return "Cú đêm Quận 4 không thể bỏ qua **Cơm Tấm Bãi Rác** (77 Lê Văn Linh, sau lưng chợ Xóm Chiếu) bán từ 16h30 đến 2h sáng với sườn cọng nướng vàng óng, chả trứng béo ngậy; hoặc các hàng mì vịt tiềm, xe ốc dọc đường Hoàng Diệu và Tôn Đản.";
        }
        return "Chào bạn! Mình là Trợ lý Du Lịch Saigon Whispers Quận 4. Quận 4 nổi danh là thiên đường ẩm thực đường phố với **Phố ốc Vĩnh Khánh**, **Phá lấu Tôn Đản**, **Chợ Xóm Chiếu** cùng các điểm di tích văn hóa lịch sử như **Bến Nhà Rồng** và **Cầu Mống**. Bạn đang muốn tìm quán ăn ngon hay địa điểm tham quan nào để mình hướng dẫn chi tiết nhé?";
    }

    /**
     * Handles Push-to-Talk voice questions while listening to audio guide.
     * 1. Transcribes spoken audio via Gemini Multimodal STT.
     * 2. Queries RAG engine with contextual POI data (history, dishes, rules).
     * 3. Optionally synthesizes spoken voice reply via TTS for hands-free listening.
     */
    public AiVoiceAskResponse askVoice(Long poiId, byte[] audioBytes, String mimeType,
                                       Double userLat, Double userLng,
                                       String conversationId, Integer playbackSeconds,
                                       boolean returnAudio) {
        if (poiId == null) {
            throw new IllegalArgumentException("poiId không được để trống.");
        }
        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("File âm thanh ghi âm không được để trống.");
        }

        AiContextRepository.PoiDetailContext poi = contextRepository
                .findPoiContext(poiId, userLat, userLng)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm với ID: " + poiId));

        // 1. Transcribe audio using Gemini STT
        String transcribed = geminiClient.transcribeAudio(audioBytes, mimeType)
                .filter(t -> !t.isBlank())
                .orElseGet(() -> {
                    if (playbackSeconds != null && playbackSeconds > 0) {
                        return "Du khách hỏi về nội dung thuyết minh tại giây thứ " + playbackSeconds + " của " + poi.name;
                    }
                    return "Du khách hỏi thông tin chi tiết và nét đặc sắc tại " + poi.name;
                });

        // 2. Query AI with full RAG context
        AiAskRequest askRequest = new AiAskRequest(poiId, transcribed, userLat, userLng, conversationId);
        AiAskResponse askResponse = askPoi(askRequest);

        // 3. Optional Voice Reply Synthesis (TTS)
        String audioUrl = null;
        if (returnAudio && askResponse.getAnswer() != null && !askResponse.getAnswer().isBlank()) {
            String token = UUID.randomUUID().toString().substring(0, 8);
            String fileName = "reply_" + token + ".mp3";
            byte[] voiceBytes = ttsService.generateSpeech(askResponse.getAnswer(), "vi");
            if (voiceBytes != null && voiceBytes.length > 0) {
                voiceReplyCache.put(fileName, voiceBytes);
                saveVoiceReplyFile(fileName, voiceBytes);
                audioUrl = "/api/v1/ai/voice-reply/" + fileName;
            }
        }

        return new AiVoiceAskResponse(
                poi.id,
                poi.name,
                transcribed,
                askResponse.getAnswer(),
                audioUrl,
                askResponse.getConversationId(),
                askResponse.getDistanceMeters(),
                askResponse.getSuggestedFollowUps()
        );
    }

    public Optional<byte[]> getVoiceReplyAudio(String fileName) {
        if (fileName == null || fileName.isBlank()) return Optional.empty();
        byte[] cached = voiceReplyCache.get(fileName);
        if (cached != null) {
            return Optional.of(cached);
        }
        Path path = Paths.get("target/classes/audio/replies/" + fileName);
        if (Files.exists(path)) {
            try {
                return Optional.of(Files.readAllBytes(path));
            } catch (IOException ignored) {}
        }
        return Optional.empty();
    }

    private void saveVoiceReplyFile(String fileName, byte[] data) {
        try {
            Path targetDir = Paths.get("target/classes/audio/replies");
            Files.createDirectories(targetDir);
            Files.write(targetDir.resolve(fileName), data);
        } catch (Exception e) {
            log.debug("Could not write voice reply file to disk, cached in memory only: {}", e.getMessage());
        }
    }

    public AiRecommendDishResponse recommendDishes(AiRecommendDishRequest request) {
        return recommendDishes(request, "vi");
    }

    public AiRecommendDishResponse recommendDishes(AiRecommendDishRequest request, String lang) {
        final boolean isEn = "en".equalsIgnoreCase(lang);
        int budget = (request.getBudget() != null && request.getBudget() > 0) ? request.getBudget() : 100000;
        int groupSize = (request.getGroupSize() != null && request.getGroupSize() > 0) ? request.getGroupSize() : 1;
        List<String> tastePreferences = request.getTastePreferences() != null ? request.getTastePreferences() : new ArrayList<>();

        List<AiContextRepository.DishSummary> candidates = contextRepository.findCandidateDishes(
                request.getUserLat(), request.getUserLng()
        );

        String systemPrompt = buildRecommendSystemPrompt(isEn);
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

        return generateFallbackRecommendations(candidates, budget, groupSize, tastePreferences, isEn);
    }

    // ─── HELPER METHODS ──────────────────────────────────────────────

    private String buildAskSystemPrompt(AiContextRepository.PoiDetailContext poi, Double distanceMeters, boolean isEn) {
        StringBuilder sb = new StringBuilder();
        boolean isLandmark = "HISTORICAL".equalsIgnoreCase(poi.poiType)
                || "RELIGIOUS".equalsIgnoreCase(poi.poiType)
                || "LANDMARK".equalsIgnoreCase(poi.poiType);

        if (isLandmark) {
            sb.append("Bạn là Hướng Dẫn Viên Du Lịch Văn Hóa & Lịch Sử Uyên Bác của Quận 4, TP.HCM.\n");
            sb.append("Phong cách: Trang trọng, nhiệt tình, am hiểu sâu sắc về lịch sử, kiến trúc và văn hóa bản địa.\n");
            sb.append("Dưới đây là dữ liệu thực tế đã được xác thực về địa điểm tham quan / danh lam này:\n");
            sb.append("- Tên địa điểm: ").append(poi.name).append(" (Loại: ").append(poi.poiType).append(")\n");
            sb.append("- Địa chỉ: ").append(poi.address).append("\n");
            sb.append("- Giờ mở cửa tham quan: ").append(poi.openingHours).append("\n");
            if (poi.priceMin != null && poi.priceMin > 0) {
                sb.append(String.format(" - Giá vé tham quan: %,d đ\n", poi.priceMin));
            } else {
                sb.append("- Giá vé: Miễn phí vào cổng (Free entry)\n");
            }
            sb.append("- Đánh giá: ").append(poi.rating).append(" sao\n");

            if (distanceMeters != null) {
                sb.append(String.format(Locale.US, "- Khoảng cách hiện tại của du khách: %.0f mét\n", distanceMeters));
            }

            if (poi.audioTranscript != null && !poi.audioTranscript.isBlank()) {
                sb.append("- Thuyết minh lịch sử & văn hóa chi tiết:\n").append(poi.audioTranscript).append("\n");
            }

            if (poi.dishes != null && !poi.dishes.isEmpty()) {
                sb.append("- Món ăn / Đồ chay phục vụ tại đây:\n");
                for (AiContextRepository.DishSummary d : poi.dishes) {
                    sb.append(String.format("  * %s (Giá: %,d %s)\n", d.name, d.price, d.unit));
                }
            }

            sb.append("\nQuy tắc trả lời:\n");
            sb.append("1. Trả lời trực tiếp vào câu hỏi, nêu bật giá trị lịch sử, kiến trúc hoặc nét đẹp văn hóa.\n");
            sb.append("2. Nếu khách hỏi về viếng thăm, hãy nhắc nhở trang phục lịch sự (quần dài, áo có tay) và giữ trang nghiêm khi vào chùa/nhà thờ.\n");
            sb.append("3. Gợi ý các góc chụp ảnh đẹp, thời điểm ngắm hoàng hôn hoặc mẹo tham quan hữu ích nếu phù hợp.\n");
            if (isEn) {
                sb.append("4. LANGUAGE REQUIREMENT: You MUST reply entirely in English. Use natural, engaging English.\n");
            }
            return sb.toString();
        }

        // Ẩm thực đường phố
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
        if (isEn) {
            sb.append("4. LANGUAGE REQUIREMENT: You MUST reply entirely in English. Use natural, engaging English.\n");
        }
        return sb.toString();
    }

    private String generateFallbackAnswer(AiContextRepository.PoiDetailContext poi, String question, Double distanceMeters, boolean isEn) {
        String qLower = question.toLowerCase(Locale.ROOT);
        boolean isLandmark = "HISTORICAL".equalsIgnoreCase(poi.poiType)
                || "RELIGIOUS".equalsIgnoreCase(poi.poiType)
                || "LANDMARK".equalsIgnoreCase(poi.poiType);

        if (isLandmark) {
            if (isEn) {
                if (qLower.contains("open") || qLower.contains("hours") || qLower.contains("giờ") || qLower.contains("mở")) {
                    return String.format("%s is open during: %s. We recommend visiting during daylight hours for the best lighting!",
                            poi.name, poi.openingHours);
                }
                if (qLower.contains("dress") || qLower.contains("wear") || qLower.contains("trang phục")) {
                    return String.format("When visiting %s, please wear respectful clothing (long pants or long skirts, sleeved shirts) and keep solemn decorum.",
                            poi.name);
                }
                if (qLower.contains("history") || qLower.contains("architect") || qLower.contains("lịch sử")) {
                    if (poi.audioTranscript != null && !poi.audioTranscript.isBlank()) {
                        return poi.audioTranscript;
                    }
                }
                return String.format("Hello! %s is a prominent landmark located at %s. Have a wonderful and meaningful visit!",
                        poi.name, poi.address);
            }

            if (qLower.contains("mở cửa") || qLower.contains("giờ")) {
                return String.format("%s mở cửa vào khung giờ: %s. Bạn nên sắp xếp thời gian đến vào ban ngày để có ánh sáng đẹp nhất nhé!",
                        poi.name, poi.openingHours);
            }
            if (qLower.contains("trang phục") || qLower.contains("mặc gì") || qLower.contains("quy định")) {
                return String.format("Khi tham quan %s, bạn vui lòng mặc trang phục lịch sự (quần dài hoặc váy dài quá gối, áo có tay), tháo nón và giữ gìn trật tự trang nghiêm nơi tôn nghiêm nhé!",
                        poi.name);
            }
            if (qLower.contains("lịch sử") || qLower.contains("kiến trúc") || qLower.contains("xây dựng") || qLower.contains("năm nào")) {
                if (poi.audioTranscript != null && !poi.audioTranscript.isBlank()) {
                    return poi.audioTranscript;
                }
            }
            return String.format("Chào bạn! %s là địa điểm văn hóa nổi bật tại %s. %s Chúc bạn có một chuyến tham quan đầy ý nghĩa!",
                    poi.name, poi.address, (poi.description != null ? poi.description : ""));
        }

        if (isEn) {
            if (qLower.contains("open") || qLower.contains("hours") || qLower.contains("mở") || qLower.contains("giờ")) {
                return String.format("%s is open during: %s. We suggest arriving early in the evening to secure the best table!",
                        poi.name, poi.openingHours);
            }
            if (qLower.contains("best") || qLower.contains("signature") || qLower.contains("try") || qLower.contains("ngon")) {
                List<String> signatures = poi.dishes.stream()
                        .filter(d -> Boolean.TRUE.equals(d.isSignature))
                        .map(d -> String.format("%s (%,d %s)", d.name, d.price, d.unit))
                        .toList();
                if (!signatures.isEmpty()) {
                    return String.format("The must-try signature delicacy of %s is: %s. Dipped with hot crispy bread, it provides an unforgettable culinary experience!",
                            poi.name, String.join(", ", signatures));
                }
            }
            if (qLower.contains("allergy") || qLower.contains("peanut") || qLower.contains("seafood") || qLower.contains("dị ứng")) {
                return String.format("At %s, dishes may contain seafood allergens, roasted peanuts, or butter. Please inform the restaurant staff before ordering!", poi.name);
            }
            return String.format("Hello! %s is located at %s (%s). The venue is renowned for District 4 street food culture. Would you like to check out any specific dish?",
                    poi.name, poi.address, poi.openingHours);
        }

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

    private List<String> generateFollowUps(AiContextRepository.PoiDetailContext poi, boolean isEn) {
        boolean isLandmark = "HISTORICAL".equalsIgnoreCase(poi.poiType)
                || "RELIGIOUS".equalsIgnoreCase(poi.poiType)
                || "LANDMARK".equalsIgnoreCase(poi.poiType);

        List<String> list = new ArrayList<>();
        if (isLandmark) {
            if (isEn) {
                list.add("Are there any dress code requirements here?");
                list.add("What is the best time of day to visit?");
                list.add("What makes the history and architecture here special?");
            } else {
                list.add("Địa điểm này có quy định trang phục gì không?");
                list.add("Thời điểm lý tưởng nhất trong ngày để ghé thăm?");
                list.add("Ý nghĩa lịch sử và nét kiến trúc nơi đây có gì đặc biệt?");
            }
            return list;
        }

        if (isEn) {
            list.add("Which dish is the must-try best-seller?");
            list.add("What time does this place close?");
            list.add("Are there non-spicy options for guests who cannot eat spicy food?");
        } else {
            list.add("Món nào là Best-seller nên thử nhất?");
            list.add("Quán mở cửa đến mấy giờ?");
            list.add("Có món nào không cay cho người không ăn được cay?");
        }
        return list;
    }

    private String buildRecommendSystemPrompt(boolean isEn) {
        if (isEn) {
            return """
                You are the Smart Culinary AI Advisor of District 4, Ho Chi Minh City.
                Your task is to select exactly 3 best-fitting dishes from the system based on:
                1. Guest total maximum budget.
                2. Group size.
                3. Taste preferences (spicy, seafood, snacks, refreshing,...).
                4. Closest user distance.

                LANGUAGE REQUIREMENT: 'summary', 'reason', and 'tips' MUST be written in English.
                MUST RETURN EXACT JSON FORMAT AS FOLLOWS:
                {
                  "summary": "Short and appetizing summary of why this combo was chosen (1-2 sentences)",
                  "totalEstimatedPrice": 95000,
                  "budgetRemaining": 5000,
                  "tips": "Useful local dining tip (e.g., dip warm crispy bread in the savory sauce)",
                  "dishes": [
                    {
                      "dishId": 1,
                      "dishName": "Dish Name",
                      "poiId": 1,
                      "poiName": "Spot Name",
                      "price": 65000,
                      "unit": "portion",
                      "imageUrl": "image url",
                      "isSignature": true,
                      "reason": "Why this dish matches the budget and taste"
                    }
                  ]
                }
                """;
        }
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
                                                                    int budget, int groupSize, List<String> tastePreferences,
                                                                    boolean isEn) {
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
                String reason = isEn
                        ? String.format("Signature delicacy of %s, perfectly matching your budget and preferences.", d.poiName)
                        : String.format("Món ngon đặc sắc của %s, phù hợp ngân sách và khẩu vị yêu thích.", d.poiName);
                chosen.add(new RecommendedDishItem(
                        d.id, d.name, d.poiId, d.poiName, d.price, d.unit,
                        d.thumbnailUrl, d.isSignature, reason
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
                        String sideReason = isEn
                                ? "Refreshing side dish to balance your meal flavors."
                                : "Món ăn kèm thanh mát giúp cân bằng hương vị bữa ăn.";
                        chosen.add(new RecommendedDishItem(
                                d.id, d.name, d.poiId, d.poiName, d.price, d.unit,
                                d.thumbnailUrl, d.isSignature, sideReason
                        ));
                        currentTotal += d.price;
                    }
                }
            }
        }

        int remaining = Math.max(0, budget - currentTotal);
        String summary = isEn
                ? String.format("Recommended 3-dish District 4 culinary combo for %d person(s) within %,d đ budget.", groupSize, budget)
                : String.format("Gợi ý combo 3 món ăn chuẩn vị Quận 4 cho %d người với ngân sách %,d đ.", groupSize, budget);
        String tips = isEn
                ? "You can order extra hot crispy bread to dip in the rich savory sauces!"
                : "Bạn có thể gọi thêm bánh mì nóng giòn để chấm nước sốt béo ngậy!";

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
