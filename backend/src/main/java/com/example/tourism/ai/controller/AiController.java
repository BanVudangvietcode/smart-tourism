package com.example.tourism.ai.controller;

import com.example.tourism.ai.dto.*;
import com.example.tourism.ai.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

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
     * Đặt câu hỏi văn bản cho AI về địa điểm hiện tại (nguyên liệu, lịch sử, văn hóa, món nên thử).
     * Xác thực hợp lệ qua @Valid, lỗi được GlobalExceptionHandler tự động bắt.
     */
    @PostMapping("/ask")
    public ResponseEntity<AiAskResponse> askPoi(@Valid @RequestBody AiAskRequest request) {
        AiAskResponse response = aiService.askPoi(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/ai/ask-voice
     * Multipart Form Data: nhận file âm thanh giọng nói ghi âm khi du khách bấm giữ mic.
     * AI tự động chuyển giọng nói thành text (STT), phân tích ngữ cảnh địa điểm và trả lời du khách.
     */
    @PostMapping(value = "/ask-voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AiVoiceAskResponse> askVoice(
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("poiId") Long poiId,
            @RequestParam(value = "userLat", required = false) Double userLat,
            @RequestParam(value = "userLng", required = false) Double userLng,
            @RequestParam(value = "conversationId", required = false) String conversationId,
            @RequestParam(value = "playbackSeconds", required = false) Integer playbackSeconds,
            @RequestParam(value = "returnAudio", required = false, defaultValue = "false") boolean returnAudio) throws IOException {

        MultipartFile activeFile = audio != null ? audio : file;
        if (activeFile == null || activeFile.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng đính kèm file âm thanh giọng nói (tham số 'audio' hoặc 'file').");
        }

        byte[] bytes = activeFile.getBytes();
        String mimeType = activeFile.getContentType() != null ? activeFile.getContentType() : "audio/webm";
        AiVoiceAskResponse response = aiService.askVoice(poiId, bytes, mimeType, userLat, userLng, conversationId, playbackSeconds, returnAudio);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/ai/ask-voice-json
     * Body JSON: dành cho Mobile App gửi âm thanh dạng chuỗi Base64.
     */
    @PostMapping("/ask-voice-json")
    public ResponseEntity<AiVoiceAskResponse> askVoiceJson(@Valid @RequestBody AiVoiceJsonRequest request) {
        String cleanBase64 = request.base64Audio().replaceAll("^data:audio/[^;]+;base64,", "");
        byte[] bytes = Base64.getDecoder().decode(cleanBase64);
        String mimeType = request.mimeType() != null ? request.mimeType() : "audio/webm";
        boolean returnAudio = Boolean.TRUE.equals(request.returnAudio());

        AiVoiceAskResponse response = aiService.askVoice(
                request.poiId(), bytes, mimeType, request.userLat(), request.userLng(),
                request.conversationId(), request.playbackSeconds(), returnAudio
        );
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/ai/voice-reply/{fileName}
     * Phát streaming câu trả lời bằng giọng nói của AI (MP3).
     */
    @GetMapping("/voice-reply/{fileName}")
    public ResponseEntity<byte[]> getVoiceReply(@PathVariable String fileName) {
        return aiService.getVoiceReplyAudio(fileName)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mpeg"))
                        .header("Cache-Control", "no-cache")
                        .body(bytes))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/ai/recommend-dish
     * AI gợi ý 3 món phù hợp nhất dựa trên ngân sách và vị trí du khách đang đứng.
     */
    @PostMapping("/recommend-dish")
    public ResponseEntity<AiRecommendDishResponse> recommendDish(@RequestBody AiRecommendDishRequest request) {
        AiRecommendDishResponse response = aiService.recommendDishes(request);
        return ResponseEntity.ok(response);
    }
}
