package com.example.tourism.translation;

import com.example.tourism.ai.service.GeminiClient;
import com.example.tourism.translation.advice.DynamicTranslationResponseAdvice;
import com.example.tourism.translation.repository.TranslationCacheRepository;
import com.example.tourism.translation.service.BatchTranslationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class DynamicTranslationTest {

    private TranslationCacheRepository repository;
    private GeminiClient geminiClient;
    private ObjectMapper objectMapper;
    private BatchTranslationService batchService;
    private DynamicTranslationResponseAdvice advice;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(TranslationCacheRepository.class);
        geminiClient = Mockito.mock(GeminiClient.class);
        objectMapper = new ObjectMapper();
        batchService = new BatchTranslationService(geminiClient, repository, objectMapper);
        advice = new DynamicTranslationResponseAdvice(repository, batchService, objectMapper);
    }

    @Test
    void testComputeHashKeyFormat() {
        String hash = BatchTranslationService.computeHashKey("en", "Quán Ốc Oanh");
        assertNotNull(hash);
        assertEquals(32, hash.length(), "Hash key MD5 phải có độ dài 32 ký tự hex");
        assertEquals(hash.toLowerCase(), hash, "Hash key phải là chữ thường");

        // Đảm bảo tính nhất quán (cùng input sinh cùng hash)
        String hash2 = BatchTranslationService.computeHashKey("EN", "Quán Ốc Oanh");
        assertEquals(hash, hash2);
    }

    @Test
    void testAdviceSkipsVietnameseAndNonApi() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/pois");
        request.setParameter("lang", "vi");
        ServletServerHttpRequest req = new ServletServerHttpRequest(request);
        ServletServerHttpResponse res = new ServletServerHttpResponse(new MockHttpServletResponse());

        Map<String, Object> data = Map.of("name", "Quán Ốc Oanh", "id", 123);
        Object result = advice.beforeBodyWrite(data, null, MediaType.APPLICATION_JSON, null, req, res);

        assertSame(data, result, "Nếu lang=vi thì phải trả về nguyên vẹn dữ liệu gốc không can thiệp");
    }

    @Test
    void testAdviceTranslatesFromCache() {
        String originalName = "Quán Ốc Oanh";
        String expectedTranslated = "Oc Oanh Eatery";
        String hash = BatchTranslationService.computeHashKey("en", originalName);

        // Giả lập cache trả về kết quả
        when(repository.findTranslationsByHashKeys(anyCollection()))
                .thenReturn(Map.of(hash, expectedTranslated));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/pois");
        request.setParameter("lang", "en");
        ServletServerHttpRequest req = new ServletServerHttpRequest(request);
        ServletServerHttpResponse res = new ServletServerHttpResponse(new MockHttpServletResponse());

        Map<String, Object> data = new HashMap<>();
        data.put("id", 1);
        data.put("slug", "quan-oc-oanh");
        data.put("name", originalName);
        data.put("lat", 10.7612);

        Object result = advice.beforeBodyWrite(data, null, MediaType.APPLICATION_JSON, null, req, res);

        assertNotNull(result);
        assertTrue(result instanceof JsonNode, "Kết quả trả về phải là JsonNode đã được dịch");
        JsonNode json = (JsonNode) result;

        // Trường whitelist 'name' phải được dịch
        assertEquals(expectedTranslated, json.get("name").asText());

        // Trường blacklist 'id', 'slug', 'lat' phải giữ nguyên
        assertEquals(1, json.get("id").asInt());
        assertEquals("quan-oc-oanh", json.get("slug").asText());
        assertEquals(10.7612, json.get("lat").asDouble(), 0.0001);
    }

    @Test
    void testAdviceCallsBatchTranslationWhenMissingInCache() {
        String originalDesc = "Món ốc xào me chua ngọt đậm đà hương vị miền Nam";
        String hashJa = BatchTranslationService.computeHashKey("ja", originalDesc);

        // Giả lập cache trống
        when(repository.findTranslationsByHashKeys(anyCollection())).thenReturn(Collections.emptyMap());

        // Giả lập Gemini trả về kết quả dịch dạng JSON
        String geminiJson = """
        [
          {
            "index": 0,
            "translations": {
              "en": "Sweet and sour tamarind snails with rich Southern flavor",
              "ja": "南部の豊かな風味を活かした甘酸っぱいタマリンド風味の巻貝料理",
              "ko": "남부의 풍미가 가득한 새콤달콤한 타마린드 우렁이 요리",
              "zh": "浓郁南部风味的酸甜罗望子炒螺",
              "fr": "Escargots au tamarin aigre-doux aux riches saveurs du Sud"
            }
          }
        ]
        """;
        when(geminiClient.generateJson(anyString(), anyString())).thenReturn(Optional.of(geminiJson));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/dishes/1");
        request.setParameter("lang", "ja");
        ServletServerHttpRequest req = new ServletServerHttpRequest(request);
        ServletServerHttpResponse res = new ServletServerHttpResponse(new MockHttpServletResponse());

        Map<String, Object> data = Map.of(
                "id", 99,
                "description", originalDesc
        );

        Object result = advice.beforeBodyWrite(data, null, MediaType.APPLICATION_JSON, null, req, res);

        assertNotNull(result);
        assertTrue(result instanceof JsonNode);
        JsonNode json = (JsonNode) result;

        assertEquals("南部の豊かな風味を活かした甘酸っぱいタマリンド風味の巻貝料理", json.get("description").asText());
    }
}
