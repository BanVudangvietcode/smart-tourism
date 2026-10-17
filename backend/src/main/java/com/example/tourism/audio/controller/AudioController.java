package com.example.tourism.audio.controller;

import com.example.tourism.audio.dto.AudioMetadataResponse;
import com.example.tourism.audio.service.AudioService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audio")
@CrossOrigin(origins = "http://localhost:3000")
public class AudioController {

    private final AudioService audioService;

    public AudioController(AudioService audioService) {
        this.audioService = audioService;
    }

    /**
     * GET /api/v1/audio/stream/{poiId}
     * Headers: Range: bytes=start-end
     * Streams audio in chunks with HTTP 206 Partial Content for instant loudspeaker playback.
     */
    @GetMapping("/stream/{poiId}")
    public ResponseEntity<byte[]> streamAudio(
            @PathVariable Long poiId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {
        return audioService.streamAudio(poiId, rangeHeader);
    }

    /**
     * GET /api/v1/audio/metadata/{poiId}
     * Returns audio guide metadata: duration in seconds, file size, voice/narrator,
     * full transcript, and timed subtitle cues for mobile scrolling subtitles.
     * Results cached in Redis.
     */
    @GetMapping("/metadata/{poiId}")
    public ResponseEntity<AudioMetadataResponse> getMetadata(@PathVariable Long poiId) {
        return audioService.getAudioMetadata(poiId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/audio/offline-pack
     * Params: zone (default: "quan4")
     * Downloads a compressed .zip package of all POI audio files and transcripts
     * in the specified zone for offline listening when tourists lose signal in alleys.
     */
    @GetMapping("/offline-pack")
    public ResponseEntity<byte[]> getOfflinePack(@RequestParam(defaultValue = "quan4") String zone) {
        return audioService.generateOfflinePack(zone)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audio_pack_" + zone + ".zip\"")
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(bytes.length))
                        .body(bytes))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/audio/generate-from-text
     * Body JSON: { poiId, title, transcript, voice?, zone? }
     * Tự động chuyển nội dung văn bản kịch bản thành tệp âm thanh MP3 (Text-To-Speech) và lưu vào hệ thống.
     */
    @PostMapping("/generate-from-text")
    public ResponseEntity<com.example.tourism.audio.dto.AudioCreateResponse> generateFromText(
            @RequestBody com.example.tourism.audio.dto.AudioTextGenerateRequest request) {
        com.example.tourism.audio.dto.AudioCreateResponse res = audioService.generateAudioFromText(request);
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/v1/audio/upload
     * Multipart Form Data: file (MP3), poiId, title, transcript, voice?, zone?
     * Cho phép quản trị viên hoặc người dùng tự tải lên tệp âm thanh MP3 tùy chỉnh.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.example.tourism.audio.dto.AudioCreateResponse> uploadCustomAudio(
            @RequestParam("poiId") Long poiId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("transcript") String transcript,
            @RequestParam(value = "voice", required = false) String voice,
            @RequestParam(value = "zone", required = false, defaultValue = "quan4") String zone,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws Exception {
        com.example.tourism.audio.dto.AudioCreateResponse res = audioService.uploadCustomAudio(
                poiId, title, transcript, voice, zone, file
        );
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/v1/audio
     * Unified JSON endpoint: mặc định tạo âm thanh từ text
     */
    @PostMapping
    public ResponseEntity<com.example.tourism.audio.dto.AudioCreateResponse> createAudio(
            @RequestBody com.example.tourism.audio.dto.AudioTextGenerateRequest request) {
        return generateFromText(request);
    }
}

