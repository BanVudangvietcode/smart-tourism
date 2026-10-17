package com.example.tourism.ai.controller;

import com.example.tourism.ai.dto.AiAskRequest;
import com.example.tourism.ai.dto.AiAskResponse;
import com.example.tourism.ai.dto.AiRecommendDishRequest;
import com.example.tourism.ai.dto.AiRecommendDishResponse;
import com.example.tourism.ai.service.AiService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /**
     * POST /api/v1/ai/ask
     * Đặt câu hỏi cho AI về quán ăn hiện tại (nguyên liệu, lịch sử quán, món nên thử).
     */
    @PostMapping("/ask")
    public ResponseEntity<?> askPoi(@RequestBody AiAskRequest request) {
        try {
            AiAskResponse response = aiService.askPoi(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xử lý câu hỏi AI: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/ai/recommend-dish
     * AI gợi ý 3 món phù hợp nhất dựa trên ngân sách và vị trí du khách đang đứng.
     */
    @PostMapping("/recommend-dish")
    public ResponseEntity<?> recommendDish(@RequestBody AiRecommendDishRequest request) {
        try {
            AiRecommendDishResponse response = aiService.recommendDishes(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi gợi ý món ăn AI: " + e.getMessage()));
        }
    }
}

