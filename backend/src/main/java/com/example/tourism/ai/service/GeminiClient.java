package com.example.tourism.ai.service;

import com.example.tourism.config.ApiKeyConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String DEFAULT_MODEL = "gemini-3.8-flash";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final ApiKeyConfig apiKeyConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public GeminiClient(ApiKeyConfig apiKeyConfig, ObjectMapper objectMapper) {
        this.apiKeyConfig = apiKeyConfig;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public Optional<String> generateText(String systemInstruction, String userPrompt) {
        return callGemini(systemInstruction, userPrompt, null, null, false);
    }

    public Optional<String> generateJson(String systemInstruction, String userPrompt) {
        return callGemini(systemInstruction, userPrompt, null, null, true);
    }

    public Optional<String> generateWithAudio(String systemInstruction, String userPrompt, byte[] audioBytes, String mimeType, boolean jsonMode) {
        return callGemini(systemInstruction, userPrompt, audioBytes, mimeType, jsonMode);
    }

    public Optional<String> generateWithImage(String systemInstruction, String userPrompt, byte[] imageBytes, String mimeType, boolean jsonMode) {
        return callGemini(systemInstruction, userPrompt, imageBytes, mimeType, jsonMode);
    }

    /**
     * Transcribes spoken Vietnamese audio to text using Gemini Multimodal Audio capability.
     */
    public Optional<String> transcribeAudio(byte[] audioBytes, String mimeType) {
        if (audioBytes == null || audioBytes.length == 0) {
            return Optional.empty();
        }
        String systemInstruction = "Bạn là bộ nhận diện giọng nói tiếng Việt (Speech-to-Text). " +
                "Hãy nghe đoạn âm thanh câu hỏi từ du khách và chuyển thành câu hỏi dạng văn bản tiếng Việt chính xác. " +
                "Chỉ trả về câu hỏi văn bản thuần túy, không có lời chào, không dấu ngoặc kép, không giải thích.";
        String prompt = "Hãy chép lại chính xác nội dung câu nói trong đoạn âm thanh sau:";
        return callGemini(systemInstruction, prompt, audioBytes, mimeType, false)
                .map(text -> text.trim().replaceAll("^\"|\"$", "").replaceAll("^'|'$", ""));
    }

    private Optional<String> callGemini(String systemInstruction, String userPrompt, byte[] audioBytes, String mimeType, boolean jsonMode) {
        String apiKey = apiKeyConfig.getGeminiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not configured. Falling back to local responder.");
            return Optional.empty();
        }

        String url = String.format(BASE_URL, DEFAULT_MODEL, apiKey);

        try {
            Map<String, Object> requestBody = new HashMap<>();

            // System instructions if provided
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                requestBody.put("system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemInstruction))
                ));
            }

            List<Map<String, Object>> parts = new ArrayList<>();
            if (userPrompt != null && !userPrompt.isBlank()) {
                parts.add(Map.of("text", userPrompt));
            }

            if (audioBytes != null && audioBytes.length > 0) {
                String base64 = Base64.getEncoder().encodeToString(audioBytes);
                String safeMime = (mimeType != null && !mimeType.isBlank()) ? mimeType.split(";")[0].trim() : "audio/webm";
                parts.add(Map.of(
                        "inline_data", Map.of(
                                "mime_type", safeMime,
                                "data", base64
                        )
                ));
            }

            // User content
            requestBody.put("contents", List.of(
                    Map.of(
                            "role", "user",
                            "parts", parts
                    )
            ));

            // Generation config
            Map<String, Object> genConfig = new HashMap<>();
            genConfig.put("temperature", 0.7);
            genConfig.put("maxOutputTokens", 1200);
            if (jsonMode) {
                genConfig.put("responseMimeType", "application/json");
            }
            requestBody.put("generationConfig", genConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode respParts = candidates.get(0).path("content").path("parts");
                    if (respParts.isArray() && !respParts.isEmpty()) {
                        String text = respParts.get(0).path("text").asText();
                        return Optional.ofNullable(text);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage());
        }

        return Optional.empty();
    }
}
