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
}

