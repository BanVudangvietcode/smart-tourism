package com.example.tourism.ai.service;

import com.example.tourism.ai.dto.AiAskRequest;
import com.example.tourism.ai.dto.AiAskResponse;
import com.example.tourism.ai.dto.AiRecommendDishRequest;
import com.example.tourism.ai.dto.AiRecommendDishResponse;
import com.example.tourism.ai.repository.AiContextRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AiService Unit Tests")
class AiServiceTest {

    @Mock
    private AiContextRepository contextRepository;

    @Mock
    private GeminiClient geminiClient;

    private ObjectMapper objectMapper;
    private AiService aiService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        aiService = new AiService(contextRepository, geminiClient, objectMapper);
    }

    private AiContextRepository.PoiDetailContext createMockPoi(Long id, String name) {
        AiContextRepository.PoiDetailContext p = new AiContextRepository.PoiDetailContext();
        p.id = id;
        p.name = name;
        p.description = "Quán ốc nổi tiếng đường Vĩnh Khánh.";
        p.address = "534 Vĩnh Khánh, P.8, Q.4";
        p.openingHours = "15:00 - 23:00";
        p.priceMin = 50000;
        p.priceMax = 200000;
        p.rating = 4.6;
        p.lat = 10.7612;
        p.lng = 106.7025;
        p.audioTranscript = "Lịch sử hơn 15 năm tại Vĩnh Khánh.";

        AiContextRepository.DishSummary d1 = new AiContextRepository.DishSummary();
        d1.id = 1L;
        d1.poiId = id;
        d1.poiName = name;
        d1.name = "Ốc hương sốt trứng muối";
        d1.price = 135000;
        d1.unit = "phần";
        d1.isSignature = true;
        d1.ingredients = "Ốc hương, trứng muối, bơ";
        d1.allergens = "Hải sản, Trứng";

        p.dishes.add(d1);
        return p;
    }

    @Test
    @DisplayName("askPoi: should return AI answer from Gemini when available")
    void askPoi_successWithGemini() {
        AiContextRepository.PoiDetailContext poi = createMockPoi(1L, "Quán Ốc Oanh");
        when(contextRepository.findPoiContext(eq(1L), any(), any())).thenReturn(Optional.of(poi));
        when(geminiClient.generateText(anyString(), anyString()))
                .thenReturn(Optional.of("Chào bạn, món ốc hương trứng muối ở Quán Ốc Oanh là đỉnh nhất đó!"));

        AiAskRequest request = new AiAskRequest(1L, "Món nào ngon nhất?", 10.7615, 106.7028, null);
        AiAskResponse response = aiService.askPoi(request);

        assertNotNull(response);
        assertEquals(1L, response.getPoiId());
        assertEquals("Quán Ốc Oanh", response.getPoiName());
        assertEquals("Chào bạn, món ốc hương trứng muối ở Quán Ốc Oanh là đỉnh nhất đó!", response.getAnswer());
        assertNotNull(response.getConversationId());
        assertNotNull(response.getDistanceMeters());
        assertFalse(response.getSuggestedFollowUps().isEmpty());
    }

    @Test
    @DisplayName("askPoi: should use local intelligent fallback when Gemini returns empty")
    void askPoi_fallbackWhenGeminiEmpty() {
        AiContextRepository.PoiDetailContext poi = createMockPoi(1L, "Quán Ốc Oanh");
        when(contextRepository.findPoiContext(eq(1L), any(), any())).thenReturn(Optional.of(poi));
        when(geminiClient.generateText(anyString(), anyString())).thenReturn(Optional.empty());

        AiAskRequest request = new AiAskRequest(1L, "Quán mở cửa mấy giờ?", null, null, "my-conv-1");
        AiAskResponse response = aiService.askPoi(request);

        assertNotNull(response);
        assertEquals("my-conv-1", response.getConversationId());
        assertTrue(response.getAnswer().contains("15:00 - 23:00"));
    }

    @Test
    @DisplayName("askPoi: should throw IllegalArgumentException when poiId is null")
    void askPoi_nullPoiId() {
        AiAskRequest request = new AiAskRequest(null, "Câu hỏi test", null, null, null);
        assertThrows(IllegalArgumentException.class, () -> aiService.askPoi(request));
    }

    @Test
    @DisplayName("askPoi: should throw NoSuchElementException when POI not found")
    void askPoi_poiNotFound() {
        when(contextRepository.findPoiContext(eq(999L), any(), any())).thenReturn(Optional.empty());

        AiAskRequest request = new AiAskRequest(999L, "Câu hỏi", null, null, null);
        assertThrows(NoSuchElementException.class, () -> aiService.askPoi(request));
    }

    @Test
    @DisplayName("recommendDishes: should parse Gemini JSON recommendation properly")
    void recommendDishes_successWithGeminiJson() {
        List<AiContextRepository.DishSummary> candidates = new ArrayList<>();
        AiContextRepository.DishSummary d = new AiContextRepository.DishSummary();
        d.id = 6L;
        d.poiId = 1L;
        d.poiName = "Quán Ốc Oanh";
        d.name = "Nghêu hấp sả Thái chua cay";
        d.price = 65000;
        d.unit = "thố";
        d.thumbnailUrl = "http://img.jpg";
        d.isSignature = false;
        candidates.add(d);

        when(contextRepository.findCandidateDishes(any(), any())).thenReturn(candidates);

        String fakeGeminiJson = """
            {
              "summary": "Combo hải sản cay nồng cực hấp dẫn cho bạn!",
              "totalEstimatedPrice": 65000,
              "budgetRemaining": 35000,
              "tips": "Nên ăn lúc còn nóng hổi!",
              "dishes": [
                {
                  "dishId": 6,
                  "dishName": "Nghêu hấp sả Thái chua cay",
                  "poiId": 1,
                  "poiName": "Quán Ốc Oanh",
                  "price": 65000,
                  "unit": "thố",
                  "imageUrl": "http://img.jpg",
                  "isSignature": false,
                  "reason": "Vị cay ấm bụng rất hợp khẩu vị yêu thích"
                }
              ]
            }
            """;

        when(geminiClient.generateJson(anyString(), anyString())).thenReturn(Optional.of(fakeGeminiJson));

        AiRecommendDishRequest req = new AiRecommendDishRequest(100000, List.of("cay", "hải sản"), 2, 10.76, 106.70);
        AiRecommendDishResponse resp = aiService.recommendDishes(req);

        assertNotNull(resp);
        assertEquals(65000, resp.getTotalEstimatedPrice());
        assertEquals(35000, resp.getBudgetRemaining());
        assertEquals(1, resp.getDishes().size());
        assertEquals("Nghêu hấp sả Thái chua cay", resp.getDishes().get(0).getDishName());
    }

    @Test
    @DisplayName("recommendDishes: should fallback to heuristic selector when Gemini is offline")
    void recommendDishes_fallbackSelector() {
        List<AiContextRepository.DishSummary> candidates = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            AiContextRepository.DishSummary d = new AiContextRepository.DishSummary();
            d.id = (long) i;
            d.poiId = 1L;
            d.poiName = "Quán Ốc Oanh";
            d.name = "Món " + i;
            d.price = 30000 * i;
            d.unit = "dĩa";
            d.isSignature = (i == 1);
            candidates.add(d);
        }

        when(contextRepository.findCandidateDishes(any(), any())).thenReturn(candidates);
        when(geminiClient.generateJson(anyString(), anyString())).thenReturn(Optional.empty());

        AiRecommendDishRequest req = new AiRecommendDishRequest(100000, List.of("cay"), 1, null, null);
        AiRecommendDishResponse resp = aiService.recommendDishes(req);

        assertNotNull(resp);
        assertFalse(resp.getDishes().isEmpty());
        assertTrue(resp.getTotalEstimatedPrice() > 0);
    }
}

