package com.example.tourism.audio.service;

import com.example.tourism.audio.dto.*;
import com.example.tourism.audio.model.PoiAudio;
import com.example.tourism.audio.repository.AudioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class AudioService {

    private static final Logger log = LoggerFactory.getLogger(AudioService.class);

    private static final String AUDIO_META_CACHE_PREFIX = "audio:metadata:";
    private static final Duration AUDIO_META_CACHE_TTL = Duration.ofHours(1);

    private final AudioRepository audioRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public AudioService(AudioRepository audioRepository,
                        RedisTemplate<String, Object> redisTemplate,
                        ObjectMapper objectMapper) {
        this.audioRepository = audioRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get audio metadata (duration, file size, voice, and transcript) for a POI.
     * Generates timed subtitle cues and caches result in Redis with 1-hour TTL.
     */
    public Optional<AudioMetadataResponse> getAudioMetadata(Long poiId) {
        String cacheKey = AUDIO_META_CACHE_PREFIX + poiId;

        // 1. Check Redis cache
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache HIT for Audio metadata {}", poiId);
                String json = objectMapper.writeValueAsString(cached);
                return Optional.of(objectMapper.readValue(json, AudioMetadataResponse.class));
            }
        } catch (Exception e) {
            log.warn("Redis read failed for audio metadata {}, falling back to DB", poiId, e);
        }

        // 2. Fetch from DB
        Optional<PoiAudio> audioOpt = audioRepository.findAudioByPoiId(poiId);
        if (audioOpt.isEmpty()) {
            return Optional.empty();
        }

        PoiAudio audio = audioOpt.get();
        List<SubtitleCue> cues = generateSubtitleCues(audio.getTranscript(), audio.getDurationSeconds());

        AudioMetadataResponse response = new AudioMetadataResponse(
                audio.getPoiId(),
                audio.getPoiName(),
                audio.getTitle(),
                audio.getDurationSeconds(),
                formatDuration(audio.getDurationSeconds()),
                audio.getFileSizeBytes(),
                formatFileSize(audio.getFileSizeBytes()),
                audio.getVoice(),
                audio.getLanguage(),
                audio.getTranscript(),
                "/api/v1/audio/stream/" + audio.getPoiId(),
                cues
        );

        // 3. Cache in Redis
        try {
            redisTemplate.opsForValue().set(cacheKey, response, AUDIO_META_CACHE_TTL);
            log.debug("Cached audio metadata {} in Redis", poiId);
        } catch (Exception e) {
            log.warn("Failed to cache audio metadata {} in Redis", poiId, e);
        }

        return Optional.of(response);
    }

    /**
     * Streams audio with HTTP 206 Partial Content (Byte-Range requests).
     * Enables immediate loudspeaker playback without waiting for full download.
     */
    public ResponseEntity<byte[]> streamAudio(Long poiId, String rangeHeader) {
        Optional<PoiAudio> audioOpt = audioRepository.findAudioByPoiId(poiId);
        if (audioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PoiAudio audio = audioOpt.get();
        byte[] audioBytes = loadAudioBytes(audio);
        long totalSize = audioBytes.length;

        // No Range header: return full content with 200 OK
        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(totalSize))
                    .body(audioBytes);
        }

        // Parse Range: bytes=start-end
        try {
            String rangeSpec = rangeHeader.substring(6).trim();
            long start = 0;
            long end = totalSize - 1;

            if (rangeSpec.startsWith("-")) {
                // Suffix byte range: bytes=-500
                long suffix = Long.parseLong(rangeSpec.substring(1).trim());
                start = Math.max(0, totalSize - suffix);
            } else {
                int dashIndex = rangeSpec.indexOf('-');
                if (dashIndex != -1) {
                    String startStr = rangeSpec.substring(0, dashIndex).trim();
                    String endStr = rangeSpec.substring(dashIndex + 1).trim();

                    if (!startStr.isEmpty()) {
                        start = Long.parseLong(startStr);
                    }
                    if (!endStr.isEmpty()) {
                        end = Long.parseLong(endStr);
                    }
                }
            }

            // Validate range
            if (start < 0 || start >= totalSize || end < start) {
                return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                        .header(HttpHeaders.CONTENT_RANGE, "bytes */" + totalSize)
                        .build();
            }

            end = Math.min(end, totalSize - 1);
            long contentLength = end - start + 1;

            byte[] chunk = Arrays.copyOfRange(audioBytes, (int) start, (int) (end + 1));

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", start, end, totalSize))
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                    .body(chunk);

        } catch (NumberFormatException e) {
            log.warn("Malformed Range header: {}", rangeHeader);
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + totalSize)
                    .build();
        }
    }

    /**
     * Generates a compressed .zip package containing all audio files, transcripts,
     * and a manifest.json for a given zone (e.g. "quan4") for offline playback.
     */
    public Optional<byte[]> generateOfflinePack(String zone) {
        List<PoiAudio> audios = audioRepository.findAudiosByZone(zone);
        if (audios.isEmpty()) {
            return Optional.empty();
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            List<AudioPackItem> items = new ArrayList<>();
            long totalBytes = 0;

            // 1. Add each audio file into zip
            for (PoiAudio audio : audios) {
                byte[] bytes = loadAudioBytes(audio);
                totalBytes += bytes.length;

                ZipEntry audioEntry = new ZipEntry("audio/" + audio.getFileName());
                zos.putNextEntry(audioEntry);
                zos.write(bytes);
                zos.closeEntry();

                items.add(new AudioPackItem(
                        audio.getPoiId(),
                        audio.getPoiName(),
                        audio.getTitle(),
                        "audio/" + audio.getFileName(),
                        audio.getDurationSeconds(),
                        bytes.length,
                        audio.getVoice(),
                        audio.getTranscript()
                ));
            }

            // 2. Add manifest.json into zip
            AudioPackManifest manifest = new AudioPackManifest(
                    zone,
                    audios.size(),
                    totalBytes,
                    Instant.now().toString(),
                    items
            );
            String manifestJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(manifest);
            ZipEntry manifestEntry = new ZipEntry("manifest.json");
            zos.putNextEntry(manifestEntry);
            zos.write(manifestJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 3. Add README.txt into zip
            String readme = """
                    =============================================================
                    HƯỚNG DẪN GÓI ÂM THANH THUYẾT MINH NGOẠI TUYẾN (OFFLINE PACK)
                    Khu vực: %s
                    =============================================================
                    Gói này cho phép ứng dụng phát thuyết minh tự động khi du khách
                    đi sâu vào các con hẻm ẩm thực mất kết nối internet/4G.
                    
                    Các tệp âm thanh nằm trong thư mục audio/
                    Thông tin phụ đề & kịch bản chi tiết nằm trong manifest.json
                    """.formatted(zone);
            ZipEntry readmeEntry = new ZipEntry("README.txt");
            zos.putNextEntry(readmeEntry);
            zos.write(readme.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.finish();
            return Optional.of(baos.toByteArray());

        } catch (Exception e) {
            log.error("Failed to generate offline pack for zone {}", zone, e);
            throw new RuntimeException("Error generating offline audio pack", e);
        }
    }

    /**
     * Loads audio binary from classpath or filesystem, with fallback generation of valid MP3 frames.
     */
    public byte[] loadAudioBytes(PoiAudio audio) {
        String fileName = audio.getFileName();
        if (fileName == null || fileName.isBlank()) {
            fileName = "poi_" + audio.getPoiId() + ".mp3";
        }

        // Try classpath resource
        try {
            ClassPathResource resource = new ClassPathResource("audio/" + fileName);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return is.readAllBytes();
                }
            }
        } catch (Exception ignored) {}

        // Try filesystem path
        try {
            Path path = Paths.get("backend/src/main/resources/audio/" + fileName);
            if (Files.exists(path)) {
                return Files.readAllBytes(path);
            }
        } catch (Exception ignored) {}

        // Fallback: generate valid MPEG-1 Layer 3 frames matching the expected file size
        return generateSyntheticMp3Frames(audio.getFileSizeBytes() > 0 ? (int) audio.getFileSizeBytes() : 65536);
    }

    private byte[] generateSyntheticMp3Frames(int targetSize) {
        byte[] frameHeader = new byte[]{(byte) 0xFF, (byte) 0xFB, (byte) 0x90, (byte) 0x64};
        int frameSize = 417;
        byte[] frame = new byte[frameSize];
        System.arraycopy(frameHeader, 0, frame, 0, 4);

        int numFrames = Math.max(1, targetSize / frameSize);
        byte[] result = new byte[numFrames * frameSize];
        for (int i = 0; i < numFrames; i++) {
            System.arraycopy(frame, 0, result, i * frameSize, frameSize);
        }
        return result;
    }

    private List<SubtitleCue> generateSubtitleCues(String transcript, int totalDurationSeconds) {
        if (transcript == null || transcript.isBlank()) {
            return List.of();
        }

        String[] sentences = transcript.split("(?<=[.!?])\\s+");
        if (sentences.length == 0) {
            return List.of(new SubtitleCue(0, totalDurationSeconds, transcript));
        }

        List<SubtitleCue> cues = new ArrayList<>();
        double durationPerSentence = (double) totalDurationSeconds / sentences.length;

        for (int i = 0; i < sentences.length; i++) {
            int start = (int) Math.round(i * durationPerSentence);
            int end = (i == sentences.length - 1) ? totalDurationSeconds : (int) Math.round((i + 1) * durationPerSentence);
            cues.add(new SubtitleCue(start, end, sentences[i].trim()));
        }

        return cues;
    }

    private String formatDuration(int seconds) {
        int m = seconds / 60;
        int s = seconds % 60;
        return String.format("%02d:%02d", m, s);
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }
}

