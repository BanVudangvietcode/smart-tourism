package com.example.tourism.audio.service;

import com.example.tourism.ai.service.GeminiClient;
import com.example.tourism.audio.dto.*;
import com.example.tourism.audio.model.PoiAudio;
import com.example.tourism.audio.repository.AudioRepository;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class AudioService {

    private static final Logger log = LoggerFactory.getLogger(AudioService.class);

    private static final String AUDIO_META_CACHE_PREFIX = "audio:metadata:";
    private static final Duration AUDIO_META_CACHE_TTL = Duration.ofHours(1);

    private final AudioRepository audioRepository;
    private final TtsService ttsService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiClient geminiClient;

    public static final Map<String, String> LANGUAGE_NAMES = Map.of(
            "vi", "Tiếng Việt",
            "en", "English",
            "zh", "中文 (Chinese)",
            "ja", "日本語 (Japanese)",
            "ko", "한국어 (Korean)",
            "fr", "Français (French)"
    );

    public static final Map<String, String> DEFAULT_VOICES = Map.of(
            "vi", "Nữ miền Nam (Truyền cảm)",
            "en", "English (Natural)",
            "zh", "中文 (标准普通话)",
            "ja", "日本語 (ナチュラル)",
            "ko", "한국어 (자연스러운)",
            "fr", "Français (Naturel)"
    );

    public AudioService(AudioRepository audioRepository,
                        RedisTemplate<String, Object> redisTemplate,
                        ObjectMapper objectMapper) {
        this(audioRepository, new TtsService(), redisTemplate, objectMapper, null);
    }

    public AudioService(AudioRepository audioRepository,
                        TtsService ttsService,
                        RedisTemplate<String, Object> redisTemplate,
                        ObjectMapper objectMapper) {
        this(audioRepository, ttsService, redisTemplate, objectMapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AudioService(AudioRepository audioRepository,
                        TtsService ttsService,
                        RedisTemplate<String, Object> redisTemplate,
                        ObjectMapper objectMapper,
                        @org.springframework.beans.factory.annotation.Autowired(required = false) GeminiClient geminiClient) {
        this.audioRepository = audioRepository;
        this.ttsService = ttsService != null ? ttsService : new TtsService();
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.geminiClient = geminiClient;
    }

    /**
     * Get audio metadata (duration, file size, voice, and transcript) for a POI.
     * Generates timed subtitle cues and caches result in Redis with 1-hour TTL.
     */
    public Optional<AudioMetadataResponse> getAudioMetadata(Long poiId) {
        return getAudioMetadata(poiId, "vi");
    }

    public Optional<AudioMetadataResponse> getAudioMetadata(Long poiId, String lang) {
        String targetLang = (lang != null && !lang.isBlank()) ? lang.trim().toLowerCase() : "vi";
        String cacheKey = AUDIO_META_CACHE_PREFIX + poiId + ":" + targetLang;

        // 1. Check Redis cache
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache HIT for Audio metadata {}:{}", poiId, targetLang);
                String json = objectMapper.writeValueAsString(cached);
                return Optional.of(objectMapper.readValue(json, AudioMetadataResponse.class));
            }
        } catch (Exception e) {
            log.warn("Redis read failed for audio metadata {}:{}, falling back to DB", poiId, targetLang, e);
        }

        // 2. Fetch from DB
        Optional<PoiAudio> audioOpt = audioRepository.findAudioByPoiIdAndLanguage(poiId, targetLang);
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
                "/api/v1/audio/stream/" + audio.getPoiId() + "?lang=" + audio.getLanguage(),
                cues
        );

        // 3. Cache in Redis
        try {
            redisTemplate.opsForValue().set(cacheKey, response, AUDIO_META_CACHE_TTL);
            log.debug("Cached audio metadata {}:{} in Redis", poiId, targetLang);
        } catch (Exception e) {
            log.warn("Failed to cache audio metadata {}:{} in Redis", poiId, targetLang, e);
        }

        return Optional.of(response);
    }

    /**
     * Streams audio with HTTP 206 Partial Content (Byte-Range requests).
     * Enables immediate loudspeaker playback without waiting for full download.
     */
    public ResponseEntity<byte[]> streamAudio(Long poiId, String rangeHeader) {
        return streamAudio(poiId, "vi", rangeHeader);
    }

    public ResponseEntity<byte[]> streamAudio(Long poiId, String lang, String rangeHeader) {
        String targetLang = (lang != null && !lang.isBlank()) ? lang.trim().toLowerCase() : "vi";
        Optional<PoiAudio> audioOpt = audioRepository.findAudioByPoiIdAndLanguage(poiId, targetLang);
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
    /**
     * Generates a compressed .zip package containing all audio files, transcripts,
     * and a manifest.json for a given zone (e.g. "quan4") for offline playback.
     */
    public Optional<byte[]> generateOfflinePack(String zone) {
        return generateOfflinePack(zone, "vi");
    }

    public Optional<byte[]> generateOfflinePack(String zone, String lang) {
        String targetLang = (lang != null && !lang.isBlank()) ? lang.trim().toLowerCase() : "vi";
        List<PoiAudio> audios = audioRepository.findAudiosByZoneAndLanguage(zone, targetLang);
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
                    Khu vực: %s | Ngôn ngữ: %s
                    =============================================================
                    Gói này cho phép ứng dụng phát thuyết minh tự động khi du khách
                    đi sâu vào các con hẻm ẩm thực mất kết nối internet/4G.
                    
                    Các tệp âm thanh nằm trong thư mục audio/
                    Thông tin phụ đề & kịch bản chi tiết nằm trong manifest.json
                    """.formatted(zone, targetLang);
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
     * Loads audio binary from classpath or filesystem, with on-demand TTS generation and fallback.
     */
    public byte[] loadAudioBytes(PoiAudio audio) {
        String fileName = audio.getFileName();
        if (fileName == null || fileName.isBlank()) {
            fileName = "poi_" + audio.getPoiId() + "_" + (audio.getLanguage() != null ? audio.getLanguage() : "vi") + ".mp3";
        }

        // 1. Try classpath resource
        try {
            ClassPathResource resource = new ClassPathResource("audio/" + fileName);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    byte[] bytes = is.readAllBytes();
                    if (bytes.length > 500) {
                        return bytes;
                    }
                }
            }
        } catch (Exception ignored) {}

        // 2. Try filesystem paths
        List<Path> checkPaths = List.of(
                Paths.get("backend/src/main/resources/audio/" + fileName),
                Paths.get("backend/target/classes/audio/" + fileName),
                Paths.get("src/main/resources/audio/" + fileName),
                Paths.get("target/classes/audio/" + fileName)
        );
        for (Path path : checkPaths) {
            try {
                if (Files.exists(path)) {
                    byte[] bytes = Files.readAllBytes(path);
                    if (bytes.length > 500) {
                        return bytes;
                    }
                }
            } catch (Exception ignored) {}
        }

        // 3. On-demand TTS generation: If file is missing on disk, synthesize with TtsService & cache to disk!
        if (audio.getTranscript() != null && !audio.getTranscript().isBlank()) {
            String lang = (audio.getLanguage() != null && !audio.getLanguage().isBlank()) ? audio.getLanguage() : "vi";
            try {
                log.info("Generating on-demand TTS audio for POI {} in '{}'...", audio.getPoiId(), lang);
                byte[] realTtsBytes = ttsService.generateSpeech(audio.getTranscript(), lang);
                if (realTtsBytes != null && realTtsBytes.length > 1000) {
                    saveAudioBytes(fileName, realTtsBytes);
                    int durationSec = ttsService.estimateDurationSeconds(audio.getTranscript());
                    audio.setDurationSeconds(durationSec);
                    audio.setFileSizeBytes(realTtsBytes.length);
                    audio.setFileName(fileName);
                    audioRepository.upsertAudio(audio);
                    return realTtsBytes;
                }
            } catch (Exception e) {
                log.warn("On-demand TTS generation failed for {}: {}", fileName, e.getMessage());
            }
        }

        // 4. Fallback: generate valid MPEG-1 Layer 3 frames matching the expected file size
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

    /**
     * Tùy chọn 1: Tự động tạo file âm thanh MP3 từ văn bản kịch bản (Text-To-Speech).
     */
    public AudioCreateResponse generateAudioFromText(AudioTextGenerateRequest request) {
        if (request == null || request.getPoiId() == null) {
            throw new IllegalArgumentException("poiId không được để trống.");
        }
        if (request.getTranscript() == null || request.getTranscript().trim().isBlank()) {
            throw new IllegalArgumentException("transcript không được để trống.");
        }

        String poiName = audioRepository.findPoiNameById(request.getPoiId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm với ID: " + request.getPoiId()));

        String title = (request.getTitle() != null && !request.getTitle().trim().isBlank())
                ? request.getTitle().trim()
                : "Thuyết minh " + poiName;

        String transcript = request.getTranscript().trim();
        String voice = (request.getVoice() != null && !request.getVoice().isBlank())
                ? request.getVoice().trim()
                : "Nữ miền Nam (Truyền cảm)";
        String zone = (request.getZone() != null && !request.getZone().isBlank())
                ? request.getZone().trim()
                : "quan4";

        // 1. Sinh âm thanh MP3 từ TTS
        byte[] audioBytes = ttsService.generateSpeech(transcript, "vi");
        String fileName = "poi_" + request.getPoiId() + ".mp3";

        // 2. Lưu file vào ổ đĩa hệ thống
        saveAudioBytes(fileName, audioBytes);
        saveAudioBytes("poi_" + request.getPoiId() + "_vi.mp3", audioBytes);

        // 3. Đo đạc độ dài
        int durationSeconds = ttsService.estimateDurationSeconds(transcript);
        long fileSizeBytes = audioBytes.length;

        // 4. Lưu vào Database (UPSERT)
        PoiAudio audio = new PoiAudio();
        audio.setPoiId(request.getPoiId());
        audio.setTitle(title);
        audio.setFileName(fileName);
        audio.setDurationSeconds(durationSeconds);
        audio.setFileSizeBytes(fileSizeBytes);
        audio.setVoice(voice);
        audio.setLanguage("vi");
        audio.setZone(zone);
        audio.setTranscript(transcript);

        Long savedId = audioRepository.upsertAudio(audio);
        audio.setId(savedId);

        // 5. Xóa Redis cache để lấy metadata mới nhất
        try {
            redisTemplate.delete(AUDIO_META_CACHE_PREFIX + request.getPoiId());
        } catch (Exception e) {
            log.warn("Failed to evict Redis cache for audio {}", request.getPoiId());
        }

        List<SubtitleCue> cues = generateSubtitleCues(transcript, durationSeconds);

        return new AudioCreateResponse(
                savedId,
                request.getPoiId(),
                poiName,
                title,
                fileName,
                durationSeconds,
                formatDuration(durationSeconds),
                fileSizeBytes,
                formatFileSize(fileSizeBytes),
                voice,
                "vi",
                zone,
                transcript,
                "/api/v1/audio/stream/" + request.getPoiId(),
                "TEXT_TO_SPEECH",
                cues
        );
    }

    public record TranslatedScript(String title, String transcript) {}

    /**
     * Dịch tiêu đề và kịch bản thuyết minh du lịch sang ngôn ngữ đích sử dụng Gemini AI.
     */
    public TranslatedScript translateScript(String originalTitle, String originalTranscript, String targetLang) {
        String langName = LANGUAGE_NAMES.getOrDefault(targetLang.toLowerCase(), targetLang);

        if (geminiClient != null) {
            try {
                String systemPrompt = """
                        You are an expert multilingual tourism translator for Saigon Whispers (Thì Thầm Sài Gòn), Vietnam.
                        Your task is to translate an audio guide title and spoken transcript from Vietnamese into %s (language code: '%s').
                        
                        Requirements:
                        1. Translate naturally, vividly, and engagingly as a spoken audio tour for international visitors.
                        2. Keep landmark and dish names recognizable (e.g. "Bến Nhà Rồng", "Ốc Oanh", "Phá Lấu Bò", "Cầu Mống").
                        3. Output MUST be valid JSON with exact keys: "title" and "transcript".
                        4. Do NOT include markdown code blocks (```json) or extra explanation.
                        """.formatted(langName, targetLang);

                String userPrompt = """
                        {
                          "originalTitle": "%s",
                          "originalTranscript": "%s"
                        }
                        """.formatted(
                                originalTitle.replace("\"", "\\\"").replace("\n", " "),
                                originalTranscript.replace("\"", "\\\"").replace("\n", " ")
                        );

                Optional<String> jsonOpt = geminiClient.generateJson(systemPrompt, userPrompt);
                if (jsonOpt.isPresent()) {
                    JsonNode node = objectMapper.readTree(jsonOpt.get());
                    String title = node.has("title") ? node.get("title").asText() : originalTitle + " (" + langName + ")";
                    String transcript = node.has("transcript") ? node.get("transcript").asText() : originalTranscript;
                    if (!transcript.isBlank()) {
                        return new TranslatedScript(title, transcript);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini translation failed for language {}: {}", targetLang, e.getMessage());
            }
        }

        // Fallback translation if Gemini is offline
        String fallbackTitle = originalTitle + " [" + langName + "]";
        String fallbackTranscript = originalTranscript;
        return new TranslatedScript(fallbackTitle, fallbackTranscript);
    }

    /**
     * Sinh bộ audio đa ngôn ngữ từ văn bản gốc (Phương án 1 - Pre-generate On-Save).
     * Tạo audio tiếng Việt gốc, dịch bằng Gemini và sinh audio TTS cho các ngôn ngữ phổ biến (en, zh, ja, ko, fr).
     */
    public MultilingualAudioResponse generateMultilingualAudio(MultilingualAudioRequest request) {
        if (request == null || request.getPoiId() == null) {
            throw new IllegalArgumentException("poiId không được để trống.");
        }
        if (request.getTranscript() == null || request.getTranscript().trim().isBlank()) {
            throw new IllegalArgumentException("transcript không được để trống.");
        }

        String poiName = audioRepository.findPoiNameById(request.getPoiId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm với ID: " + request.getPoiId()));

        String originalTitle = (request.getTitle() != null && !request.getTitle().trim().isBlank())
                ? request.getTitle().trim()
                : "Thuyết minh " + poiName;

        String originalTranscript = request.getTranscript().trim();
        String zone = (request.getZone() != null && !request.getZone().isBlank()) ? request.getZone().trim() : "quan4";
        String viVoice = (request.getVoice() != null && !request.getVoice().isBlank()) ? request.getVoice().trim() : DEFAULT_VOICES.get("vi");

        // 1. Sinh audio gốc tiếng Việt (vi)
        AudioTextGenerateRequest viRequest = new AudioTextGenerateRequest(request.getPoiId(), originalTitle, originalTranscript, viVoice, zone);
        AudioCreateResponse originalResponse = generateAudioFromText(viRequest);

        // 2. Danh sách ngôn ngữ đích (mặc định: en, zh, ja, ko, fr)
        List<String> targetLangs = request.getTargetLanguages();
        if (targetLangs == null || targetLangs.isEmpty()) {
            targetLangs = List.of("en", "zh", "ja", "ko", "fr");
        }

        List<AudioCreateResponse> translatedList = new ArrayList<>();
        for (String rawLang : targetLangs) {
            String lang = rawLang.trim().toLowerCase();
            if ("vi".equals(lang)) continue; // đã tạo tiếng Việt ở bước 1

            try {
                // A. Dịch tiêu đề và kịch bản bằng Gemini AI
                TranslatedScript translated = translateScript(originalTitle, originalTranscript, lang);
                String langVoice = DEFAULT_VOICES.getOrDefault(lang, "Giọng đọc AI (" + lang + ")");

                // B. Sinh âm thanh bằng TtsService cho ngôn ngữ đích
                byte[] audioBytes = ttsService.generateSpeech(translated.transcript(), lang);
                String fileName = "poi_" + request.getPoiId() + "_" + lang + ".mp3";

                // C. Lưu file xuống đĩa cứng
                saveAudioBytes(fileName, audioBytes);

                // D. Đo đạc thời lượng & dung lượng
                int durationSeconds = ttsService.estimateDurationSeconds(translated.transcript());
                long fileSizeBytes = audioBytes.length;

                // E. Lưu vào Database (UPSERT với poi_id và language)
                PoiAudio audio = new PoiAudio();
                audio.setPoiId(request.getPoiId());
                audio.setTitle(translated.title());
                audio.setFileName(fileName);
                audio.setDurationSeconds(durationSeconds);
                audio.setFileSizeBytes(fileSizeBytes);
                audio.setVoice(langVoice);
                audio.setLanguage(lang);
                audio.setZone(zone);
                audio.setTranscript(translated.transcript());

                Long savedId = audioRepository.upsertAudio(audio);
                audio.setId(savedId);

                // F. Xóa Redis cache cho ngôn ngữ này
                try {
                    redisTemplate.delete(AUDIO_META_CACHE_PREFIX + request.getPoiId() + ":" + lang);
                    redisTemplate.delete(AUDIO_META_CACHE_PREFIX + request.getPoiId());
                } catch (Exception e) {
                    log.warn("Failed to evict Redis cache for audio {}:{}", request.getPoiId(), lang);
                }

                List<SubtitleCue> cues = generateSubtitleCues(translated.transcript(), durationSeconds);
                AudioCreateResponse langResponse = new AudioCreateResponse(
                        savedId,
                        request.getPoiId(),
                        poiName,
                        translated.title(),
                        fileName,
                        durationSeconds,
                        formatDuration(durationSeconds),
                        fileSizeBytes,
                        formatFileSize(fileSizeBytes),
                        langVoice,
                        lang,
                        zone,
                        translated.transcript(),
                        "/api/v1/audio/stream/" + request.getPoiId() + "?lang=" + lang,
                        "AI_MULTILINGUAL_TRANSLATION",
                        cues
                );
                translatedList.add(langResponse);
                log.info("Successfully generated {} audio for POI {}: {}", lang, request.getPoiId(), translated.title());
            } catch (Exception e) {
                log.error("Failed to generate {} audio for POI {}: {}", lang, request.getPoiId(), e.getMessage());
            }
        }

        int totalLangs = 1 + translatedList.size();
        String summaryMsg = "Đã sinh thành công bộ âm thanh cho " + totalLangs + " ngôn ngữ (VI và " +
                translatedList.stream().map(AudioCreateResponse::language).collect(Collectors.joining(", ")) + ").";

        return new MultilingualAudioResponse(
                request.getPoiId(),
                poiName,
                originalResponse,
                translatedList,
                totalLangs,
                summaryMsg
        );
    }

    /**
     * Tùy chọn 2: Người dùng tự tải lên file MP3 tùy chỉnh (Custom MP3 Upload).
     */
    public AudioCreateResponse uploadCustomAudio(Long poiId, String title, String transcript,
                                                 String voice, String zone, MultipartFile file) throws IOException {
        if (poiId == null) {
            throw new IllegalArgumentException("poiId không được để trống.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File âm thanh MP3 không được để trống.");
        }
        if (transcript == null || transcript.trim().isBlank()) {
            throw new IllegalArgumentException("transcript không được để trống (dùng để hiện phụ đề và cho AI).");
        }

        String poiName = audioRepository.findPoiNameById(poiId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy địa điểm với ID: " + poiId));

        String finalTitle = (title != null && !title.trim().isBlank())
                ? title.trim()
                : "Thuyết minh " + poiName;

        String finalVoice = (voice != null && !voice.isBlank())
                ? voice.trim()
                : "Tự tải lên (Custom Audio)";

        String finalZone = (zone != null && !zone.isBlank())
                ? zone.trim()
                : "quan4";

        String cleanTranscript = transcript.trim();
        byte[] audioBytes = file.getBytes();
        String fileName = "poi_" + poiId + ".mp3";

        // 1. Lưu file vào ổ đĩa hệ thống
        saveAudioBytes(fileName, audioBytes);

        // 2. Tính toán độ dài & dung lượng
        int durationSeconds = Math.max(5, (int) Math.round((double) audioBytes.length / (128000.0 / 8.0)));
        if (durationSeconds <= 5) {
            durationSeconds = ttsService.estimateDurationSeconds(cleanTranscript);
        }
        long fileSizeBytes = audioBytes.length;

        // 3. Lưu vào Database (UPSERT)
        PoiAudio audio = new PoiAudio();
        audio.setPoiId(poiId);
        audio.setTitle(finalTitle);
        audio.setFileName(fileName);
        audio.setDurationSeconds(durationSeconds);
        audio.setFileSizeBytes(fileSizeBytes);
        audio.setVoice(finalVoice);
        audio.setLanguage("vi");
        audio.setZone(finalZone);
        audio.setTranscript(cleanTranscript);

        Long savedId = audioRepository.upsertAudio(audio);
        audio.setId(savedId);

        // 4. Xóa Redis cache
        try {
            redisTemplate.delete(AUDIO_META_CACHE_PREFIX + poiId);
        } catch (Exception e) {
            log.warn("Failed to evict Redis cache for audio {}", poiId);
        }

        List<SubtitleCue> cues = generateSubtitleCues(cleanTranscript, durationSeconds);

        return new AudioCreateResponse(
                savedId,
                poiId,
                poiName,
                finalTitle,
                fileName,
                durationSeconds,
                formatDuration(durationSeconds),
                fileSizeBytes,
                formatFileSize(fileSizeBytes),
                finalVoice,
                "vi",
                finalZone,
                cleanTranscript,
                "/api/v1/audio/stream/" + poiId,
                "DIRECT_UPLOAD",
                cues
        );
    }

    /**
     * Lưu dữ liệu âm thanh nhị phân vào đĩa cứng (cả thư mục resources và target classes để server nhận ngay).
     */
    public void saveAudioBytes(String fileName, byte[] bytes) {
        List<Path> targets = List.of(
                Paths.get("backend/src/main/resources/audio/" + fileName),
                Paths.get("backend/target/classes/audio/" + fileName),
                Paths.get("src/main/resources/audio/" + fileName),
                Paths.get("target/classes/audio/" + fileName)
        );

        for (Path path : targets) {
            try {
                Path parent = path.getParent();
                if (parent != null) {
                    Files.createDirectories(parent);
                }
                Files.write(path, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                log.info("Saved audio file to {}", path.toAbsolutePath());
            } catch (Exception ignored) {}
        }
    }
}

