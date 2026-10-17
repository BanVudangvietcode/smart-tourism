package com.example.tourism.ai.controller;

import com.example.tourism.ai.dto.AiAskRequest;
import com.example.tourism.ai.dto.AiAskResponse;
import com.example.tourism.ai.dto.AiRecommendDishRequest;
import com.example.tourism.ai.dto.AiRecommendDishResponse;
import com.example.tourism.ai.dto.RecommendedDishItem;
import com.example.tourism.ai.service.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AiController Unit Tests")
class AiControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AiService aiService;

    @InjectMocks
    private AiController aiController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aiController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/v1/ai/ask: should return 200 with answer")
    void askPoi_success() throws Exception {
        AiAskResponse response = new AiAskResponse(
                "Món ốc hương trứng muối rất ngon!",
                1L, "Quán Ốc Oanh", "conv-1", 45.0, List.of("Gợi ý 1")
        );

        when(aiService.askPoi(any())).thenReturn(response);

        AiAskRequest request = new AiAskRequest(1L, "Có gì ngon?", 10.76, 106.70, "conv-1");

        mockMvc.perform(post("/api/v1/ai/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Món ốc hương trứng muối rất ngon!"))
                .andExpect(jsonPath("$.poiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.conversationId").value("conv-1"))
                .andExpect(jsonPath("$.distanceMeters").value(45.0));
    }

    @Test
    @DisplayName("POST /api/v1/ai/ask: should return 400 when poiId is null")
    void askPoi_badRequest() throws Exception {
        when(aiService.askPoi(any())).thenThrow(new IllegalArgumentException("poiId không được để trống."));

        AiAskRequest request = new AiAskRequest(null, "Câu hỏi", null, null, null);

        mockMvc.perform(post("/api/v1/ai/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("poiId không được để trống."));
    }

    @Test
    @DisplayName("POST /api/v1/ai/ask: should return 404 when POI not found")
    void askPoi_notFound() throws Exception {
        when(aiService.askPoi(any())).thenThrow(new NoSuchElementException("Không tìm thấy quán"));

        AiAskRequest request = new AiAskRequest(999L, "Câu hỏi", null, null, null);

        mockMvc.perform(post("/api/v1/ai/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Không tìm thấy quán"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/recommend-dish: should return 200 with recommended dishes")
    void recommendDish_success() throws Exception {
        RecommendedDishItem item = new RecommendedDishItem(
                6L, "Nghêu hấp sả", 1L, "Quán Ốc Oanh", 65000, "thố", "http://img.jpg", false, "Rất ngon"
        );
        AiRecommendDishResponse response = new AiRecommendDishResponse(
                "Combo ốc", 65000, 35000, List.of(item), "Ăn kèm bánh mì"
        );

        when(aiService.recommendDishes(any())).thenReturn(response);

        AiRecommendDishRequest request = new AiRecommendDishRequest(100000, List.of("hải sản"), 2, null, null);

        mockMvc.perform(post("/api/v1/ai/recommend-dish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEstimatedPrice").value(65000))
                .andExpect(jsonPath("$.budgetRemaining").value(35000))
                .andExpect(jsonPath("$.dishes[0].dishName").value("Nghêu hấp sả"));
    }
}

