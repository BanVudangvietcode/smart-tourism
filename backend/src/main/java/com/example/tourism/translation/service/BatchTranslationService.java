package com.example.tourism.translation.service;

import com.example.tourism.ai.service.GeminiClient;
import com.example.tourism.translation.model.TranslationCacheEntry;
import com.example.tourism.translation.repository.TranslationCacheRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BatchTranslationService {

    private static final Logger log = LoggerFactory.getLogger(BatchTranslationService.class);

    public static final List<String> ALL_SUPPORTED_TARGET_LOCALES = List.of("en", "ja", "ko", "zh", "fr");

    private static final String SYSTEM_PROMPT =
            "Bạn là chuyên gia bản địa hóa website. Dịch mảng văn bản tiếng Việt sang các ngôn ngữ đích được yêu cầu. " +
            "Văn phong tự nhiên theo ngữ cảnh web du lịch, ẩm thực. Giữ nguyên tuyệt đối thẻ HTML, Markdown, " +
            "biến số ({name}, {{count}}, %s) và tên thương hiệu. Chỉ trả về JSON thuần túy theo đúng schema.";

    private final GeminiClient geminiClient;
    private final TranslationCacheRepository translationCacheRepository;
    private final ObjectMapper objectMapper;

    // In-memory locks để tránh gọi AI trùng lặp cho các chuỗi đang trong tiến trình dịch
    private final ConcurrentHashMap<String, CompletableFuture<Map<String, String>>> inFlightTranslations = new ConcurrentHashMap<>();

    public BatchTranslationService(GeminiClient geminiClient,
                                   TranslationCacheRepository translationCacheRepository,
                                   ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.translationCacheRepository = translationCacheRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Tạo mã băm MD5 duy nhất cho cặp locale:original_text
     * Định dạng: MD5("{target_lang}:{original_text}")
     */
    public static String computeHashKey(String locale, String originalText) {
        String cleanLocale = (locale != null) ? locale.trim().toLowerCase() : "vi";
        String cleanText = (originalText != null) ? originalText.trim() : "";
        String raw = cleanLocale + ":" + cleanText;
        return DigestUtils.md5DigestAsHex(raw.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Dịch một danh sách chuỗi tiếng Việt sang các ngôn ngữ đích trong 1 request duy nhất tới AI,
     * tự động tính hash_key và bulk insert vào bảng translation_cache.
     *
     * @param texts       Danh sách văn bản nguồn tiếng Việt
     * @param targetLangs Danh sách mã ngôn ngữ cần dịch tới (mặc định en, ja, ko, zh, fr)
     * @return Map<originalText, Map<locale, translatedText>>
     */
    public Map<String, Map<String, String>> translateBatch(List<String> texts, List<String> targetLangs) {
        if (texts == null || texts.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> locales = (targetLangs != null && !targetLangs.isEmpty())
                ? targetLangs
                : ALL_SUPPORTED_TARGET_LOCALES;

        // Lọc chuỗi hợp lệ và loại bỏ trùng lặp trong đợt dịch
        List<String> uniqueTexts = texts.stream()
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toList();

        if (uniqueTexts.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Map<String, String>> finalResults = new HashMap<>();

        // Kiểm tra xem các chuỗi có đang được xử lý trong inFlightTranslations không
        List<String> neededApiTexts = new ArrayList<>();
        List<CompletableFuture<Map<String, String>>> pendingFutures = new ArrayList<>();

        for (String text : uniqueTexts) {
            CompletableFuture<Map<String, String>> existingFuture = inFlightTranslations.get(text);
            if (existingFuture != null) {
                pendingFutures.add(existingFuture);
            } else {
                neededApiTexts.add(text);
            }
        }

        // Đợi các future đang chạy (nếu có)
        for (CompletableFuture<Map<String, String>> f : pendingFutures) {
            try {
                Map<String, String> resolved = f.join();
                if (resolved != null && !resolved.isEmpty()) {
                    // Cần tìm text tương ứng với resolved
                }
            } catch (Exception e) {
                log.warn("Error waiting for in-flight translation: {}", e.getMessage());
            }
        }

        if (neededApiTexts.isEmpty()) {
            return finalResults;
        }

        // Tạo các Promise (CompletableFuture) giữ chỗ cho các chuỗi sắp gọi AI
        Map<String, CompletableFuture<Map<String, String>>> newFutures = new HashMap<>();
        for (String text : neededApiTexts) {
            CompletableFuture<Map<String, String>> fut = new CompletableFuture<>();
            inFlightTranslations.put(text, fut);
            newFutures.put(text, fut);
        }

        try {
            // Xây dựng prompt có cấu trúc index rõ ràng
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Dịch mảng văn bản tiếng Việt sau đây sang các ngôn ngữ: ")
                    .append(String.join(", ", locales))
                    .append(".\n\n")
                    .append("Danh sách văn bản nguồn:\n");

            for (int i = 0; i < neededApiTexts.size(); i++) {
                // Escape newline và quotes trong prompt
                String safe = neededApiTexts.get(i).replace("\n", "\\n");
                promptBuilder.append(i).append(": \"").append(safe).append("\"\n");
            }

            promptBuilder.append("\nTrả về mảng JSON đúng cấu trúc sau:\n")
                    .append("[\n")
                    .append("  {\n")
                    .append("    \"index\": 0,\n")
                    .append("    \"translations\": {\n");
            for (int j = 0; j < locales.size(); j++) {
                promptBuilder.append("      \"").append(locales.get(j)).append("\": \"...\"");
                if (j < locales.size() - 1) promptBuilder.append(",");
                promptBuilder.append("\n");
            }
            promptBuilder.append("    }\n")
                    .append("  }\n")
                    .append("]\n");

            log.info("Gửi {} chuỗi tiếng Việt tới AI để dịch sang [{}]", neededApiTexts.size(), String.join(",", locales));
            Optional<String> jsonOpt = geminiClient.generateJson(SYSTEM_PROMPT, promptBuilder.toString());

            List<TranslationCacheEntry> cacheEntriesToSave = new ArrayList<>();

            if (jsonOpt.isPresent() && !jsonOpt.get().isBlank()) {
                String rawJson = jsonOpt.get().trim();
                // Loại bỏ codeblock markdown nếu có
                if (rawJson.startsWith("```json")) rawJson = rawJson.substring(7);
                if (rawJson.startsWith("```")) rawJson = rawJson.substring(3);
                if (rawJson.endsWith("```")) rawJson = rawJson.substring(0, rawJson.length() - 3);
                rawJson = rawJson.trim();

                JsonNode rootNode = objectMapper.readTree(rawJson);
                JsonNode items = rootNode.isArray() ? rootNode : rootNode.path("translations");

                if (items.isArray()) {
                    for (JsonNode item : items) {
                        int idx = item.path("index").asInt(-1);
                        if (idx >= 0 && idx < neededApiTexts.size()) {
                            String original = neededApiTexts.get(idx);
                            Map<String, String> langMap = new HashMap<>();

                            JsonNode transNode = item.path("translations");
                            if (transNode.isObject()) {
                                for (String loc : locales) {
                                    if (transNode.hasNonNull(loc)) {
                                        String translated = transNode.path(loc).asText();
                                        if (translated != null && !translated.isBlank()) {
                                            langMap.put(loc, translated);
                                            String hash = computeHashKey(loc, original);
                                            cacheEntriesToSave.add(new TranslationCacheEntry(hash, loc, translated));
                                        }
                                    }
                                }
                            }

                            finalResults.put(original, langMap);
                            CompletableFuture<Map<String, String>> fut = newFutures.get(original);
                            if (fut != null) fut.complete(langMap);
                        }
                    }
                }
            } else {
                log.warn("Gemini API không trả về kết quả dịch.");
            }

            // Bulk Insert vào database
            if (!cacheEntriesToSave.isEmpty()) {
                translationCacheRepository.saveBatch(cacheEntriesToSave);
                log.info("Đã lưu {} bản dịch vào translation_cache", cacheEntriesToSave.size());
            }

        } catch (Exception e) {
            log.error("Lỗi khi thực hiện dịch hàng loạt với AI: {}", e.getMessage(), e);
        } finally {
            // Hoàn tất các Promise chưa hoàn thành và dọn dẹp inFlightTranslations
            for (Map.Entry<String, CompletableFuture<Map<String, String>>> entry : newFutures.entrySet()) {
                if (!entry.getValue().isDone()) {
                    entry.getValue().complete(Collections.emptyMap());
                }
                inFlightTranslations.remove(entry.getKey());
            }
        }

        return finalResults;
    }
}
