package com.example.tourism.translation.advice;

import com.example.tourism.translation.service.BatchTranslationService;
import com.example.tourism.translation.repository.TranslationCacheRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.*;

/**
 * Global ResponseBodyAdvice tự động đánh chặn và dịch thuật các response JSON của API
 * sang 5 ngôn ngữ đích (en, ja, ko, zh, fr) dựa trên tham số ?lang= hoặc Header Accept-Language.
 * Giữ nguyên 100% dữ liệu gốc tiếng Việt nếu lang=vi.
 */
@ControllerAdvice
public class DynamicTranslationResponseAdvice implements ResponseBodyAdvice<Object> {

    private static final Logger log = LoggerFactory.getLogger(DynamicTranslationResponseAdvice.class);

    private final TranslationCacheRepository translationCacheRepository;
    private final BatchTranslationService batchTranslationService;
    private final ObjectMapper objectMapper;

    public DynamicTranslationResponseAdvice(TranslationCacheRepository translationCacheRepository,
                                            BatchTranslationService batchTranslationService,
                                            ObjectMapper objectMapper) {
        this.translationCacheRepository = translationCacheRepository;
        this.batchTranslationService = batchTranslationService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return MappingJackson2HttpMessageConverter.class.isAssignableFrom(converterType);
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        if (body == null) {
            return null;
        }

        // 1. Chỉ can thiệp các API endpoint, loại trừ auth, swagger, actuator, error
        String path = request.getURI().getPath();
        if (path == null || !path.startsWith("/api/")) {
            return body;
        }
        if (path.contains("/auth") || path.contains("/swagger") || path.contains("/api-docs") || path.contains("/error")) {
            return body;
        }

        // 2. Xác định ngôn ngữ yêu cầu
        String lang = extractRequestedLocale(request);
        if (lang == null || "vi".equalsIgnoreCase(lang) || !BatchTranslationService.ALL_SUPPORTED_TARGET_LOCALES.contains(lang.toLowerCase())) {
            return body;
        }
        String targetLocale = lang.toLowerCase();

        try {
            // 3. Chuyển body thành cây Jackson JsonNode
            JsonNode rootNode = objectMapper.valueToTree(body);
            if (rootNode == null || (!rootNode.isObject() && !rootNode.isArray())) {
                return body;
            }

            // 4. Thu thập các chuỗi văn bản cần dịch từ cây JSON
            Set<String> translatableStrings = new LinkedHashSet<>();
            collectTranslatableStrings(rootNode, "", translatableStrings);

            if (translatableStrings.isEmpty()) {
                return body;
            }

            // 5. Tính mã băm MD5 và truy vấn translation_cache 1 lần duy nhất
            Map<String, String> hashToOriginal = new HashMap<>();
            for (String str : translatableStrings) {
                String hash = BatchTranslationService.computeHashKey(targetLocale, str);
                hashToOriginal.put(hash, str);
            }

            Map<String, String> cachedTranslationsByHash = translationCacheRepository.findTranslationsByHashKeys(hashToOriginal.keySet());
            Map<String, String> translationMap = new HashMap<>(); // originalText -> translatedText
            List<String> missingTexts = new ArrayList<>();

            for (Map.Entry<String, String> entry : hashToOriginal.entrySet()) {
                String hash = entry.getKey();
                String original = entry.getValue();
                if (cachedTranslationsByHash.containsKey(hash)) {
                    translationMap.put(original, cachedTranslationsByHash.get(hash));
                } else {
                    missingTexts.add(original);
                }
            }

            // 6. Nếu có chuỗi chưa có trong cache: Gọi BatchTranslationService dịch đồng loạt
            if (!missingTexts.isEmpty()) {
                log.info("Phát hiện {} chuỗi chưa có trong cache cho locale [{}]. Đang gọi dịch AI...", missingTexts.size(), targetLocale);
                try {
                    Map<String, Map<String, String>> batchResult = batchTranslationService.translateBatch(missingTexts, BatchTranslationService.ALL_SUPPORTED_TARGET_LOCALES);
                    for (String missing : missingTexts) {
                        Map<String, String> byLocale = batchResult.get(missing);
                        if (byLocale != null && byLocale.containsKey(targetLocale)) {
                            translationMap.put(missing, byLocale.get(targetLocale));
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi gọi BatchTranslationService: {}", e.getMessage());
                }
            }

            // 7. Thay thế trực tiếp các bản dịch tương ứng vào JSON trả về
            if (!translationMap.isEmpty()) {
                replaceTranslatableStrings(rootNode, "", translationMap);
            }

            return rootNode;

        } catch (Exception e) {
            log.error("Lỗi trong quá trình dịch tự động response: {}", e.getMessage(), e);
            return body;
        }
    }

    /**
     * Trích xuất locale từ query param ?lang= hoặc header Accept-Language
     */
    private String extractRequestedLocale(ServerHttpRequest request) {
        // 1. Đọc từ ServletRequest parameter nếu là ServletServerHttpRequest
        if (request instanceof org.springframework.http.server.ServletServerHttpRequest servletReq) {
            String param = servletReq.getServletRequest().getParameter("lang");
            if (param != null && !param.isBlank()) {
                return normalizeLocale(param);
            }
            param = servletReq.getServletRequest().getParameter("locale");
            if (param != null && !param.isBlank()) {
                return normalizeLocale(param);
            }
        }

        // 2. Đọc từ URI query string
        String query = request.getURI().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] parts = param.split("=");
                if (parts.length >= 2 && ("lang".equalsIgnoreCase(parts[0]) || "locale".equalsIgnoreCase(parts[0]))) {
                    return normalizeLocale(parts[1]);
                }
            }
        }

        // 3. Đọc từ Header Accept-Language
        String header = request.getHeaders().getFirst("Accept-Language");
        if (header != null && !header.isBlank()) {
            return normalizeLocale(header);
        }

        return "vi";
    }

    private String normalizeLocale(String raw) {
        if (raw == null || raw.isBlank()) return "vi";
        String clean = raw.trim().toLowerCase();
        if (clean.startsWith("vi")) return "vi";
        if (clean.startsWith("en")) return "en";
        if (clean.startsWith("ja") || clean.startsWith("jp")) return "ja";
        if (clean.startsWith("ko") || clean.startsWith("kr")) return "ko";
        if (clean.startsWith("zh") || clean.startsWith("cn")) return "zh";
        if (clean.startsWith("fr")) return "fr";
        return clean.length() >= 2 ? clean.substring(0, 2) : clean;
    }

    /**
     * Duyệt đệ quy cây JsonNode để thu thập tất cả chuỗi văn bản cần dịch
     */
    private void collectTranslatableStrings(JsonNode node, String fieldName, Set<String> collected) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> fields = obj.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String key = entry.getKey();
                JsonNode child = entry.getValue();

                if (child.isTextual() && isTranslatableField(key)) {
                    String val = child.asText();
                    if (isTranslatableText(val)) {
                        collected.add(val);
                    }
                } else if (child.isContainerNode()) {
                    collectTranslatableStrings(child, key, collected);
                }
            }
        } else if (node.isArray()) {
            ArrayNode arr = (ArrayNode) node;
            for (JsonNode child : arr) {
                if (child.isTextual() && isTranslatableField(fieldName)) {
                    String val = child.asText();
                    if (isTranslatableText(val)) {
                        collected.add(val);
                    }
                } else if (child.isContainerNode()) {
                    collectTranslatableStrings(child, fieldName, collected);
                }
            }
        }
    }

    /**
     * Thay thế chuỗi dịch tương ứng vào JsonNode
     */
    private void replaceTranslatableStrings(JsonNode node, String fieldName, Map<String, String> translationMap) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> fields = obj.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String key = entry.getKey();
                JsonNode child = entry.getValue();

                if (child.isTextual() && isTranslatableField(key)) {
                    String original = child.asText();
                    String translated = translationMap.get(original);
                    if (translated != null && !translated.isBlank()) {
                        obj.put(key, translated);
                    }
                } else if (child.isContainerNode()) {
                    replaceTranslatableStrings(child, key, translationMap);
                }
            }
        } else if (node.isArray()) {
            ArrayNode arr = (ArrayNode) node;
            for (int i = 0; i < arr.size(); i++) {
                JsonNode child = arr.get(i);
                if (child.isTextual() && isTranslatableField(fieldName)) {
                    String original = child.asText();
                    String translated = translationMap.get(original);
                    if (translated != null && !translated.isBlank()) {
                        arr.set(i, TextNode.valueOf(translated));
                    }
                } else if (child.isContainerNode()) {
                    replaceTranslatableStrings(child, fieldName, translationMap);
                }
            }
        }
    }

    /**
     * Kiểm tra tên trường có phải trường văn bản cần dịch hay không
     */
    private boolean isTranslatableField(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) return false;
        String f = fieldName.toLowerCase().replace("_", "");

        // Blacklist loại trừ
        if (f.equals("id") || f.endsWith("id") || f.contains("slug") || f.contains("url") ||
            f.contains("email") || f.contains("code") || f.contains("status") || f.contains("role") ||
            f.contains("type") || f.contains("lat") || f.contains("lng") || f.contains("price") ||
            f.contains("rating") || f.contains("createdat") || f.contains("updatedat") ||
            f.contains("token") || f.contains("count") || f.contains("duration") ||
            f.contains("distance") || f.contains("cost") || f.contains("phone") || f.contains("color") ||
            f.contains("emoji") || f.contains("thumbnail") || f.contains("avatar") || f.contains("hash")) {
            return false;
        }

        // Whitelist các trường nội dung
        return f.contains("name") || f.contains("title") || f.contains("description") ||
               f.contains("desc") || f.contains("content") || f.contains("summary") ||
               f.contains("address") || f.contains("district") || f.contains("ward") ||
               f.contains("note") || f.contains("tip") || f.contains("reason") ||
               f.contains("instruction") || f.contains("activity") || f.contains("dish") ||
               f.contains("caption") || f.contains("label") || f.contains("subtitle") ||
               f.contains("answer") || f.contains("recommend") || f.contains("openinghours");
    }

    /**
     * Kiểm tra giá trị chuỗi có phải là văn bản cần dịch hay không
     */
    private boolean isTranslatableText(String text) {
        if (text == null) return false;
        String trimmed = text.trim();
        if (trimmed.length() < 2 || trimmed.length() > 5000) return false;

        // Bỏ qua URL, đường dẫn file
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
            return false;
        }

        // Bỏ qua số, mã màu hex, định dạng ngày tháng
        if (trimmed.matches("^[-+]?[0-9,.]+$") || trimmed.matches("^#([A-Fa-f0-9]{3,8})$") || trimmed.matches("^\\d{4}-\\d{2}-\\d{2}.*")) {
            return false;
        }

        // Phải chứa ít nhất 1 chữ cái
        boolean hasLetter = false;
        for (char c : trimmed.toCharArray()) {
            if (Character.isLetter(c)) {
                hasLetter = true;
                break;
            }
        }
        return hasLetter;
    }
}
