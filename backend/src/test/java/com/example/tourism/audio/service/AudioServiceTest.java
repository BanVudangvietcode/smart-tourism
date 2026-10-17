package com.example.tourism.audio.service;

import com.example.tourism.audio.dto.AudioMetadataResponse;
import com.example.tourism.audio.model.PoiAudio;
import com.example.tourism.audio.repository.AudioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayInputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AudioServiceTest {

    private AudioRepository audioRepository;
    private RedisTemplate<String, Object> redisTemplate;
    private ValueOperations<String, Object> valueOperations;
    private ObjectMapper objectMapper;
    private AudioService audioService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        audioRepository = mock(AudioRepository.class);
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        objectMapper = new ObjectMapper();
        audioService = new AudioService(audioRepository, redisTemplate, objectMapper);
    }

    private PoiAudio createSampleAudio(Long poiId) {
        PoiAudio a = new PoiAudio();
        a.setId(10L);
        a.setPoiId(poiId);
        a.setPoiName("Quán Ốc Oanh");
        a.setTitle("Thuyết minh Phố Ốc Vĩnh Khánh & Quán Ốc Oanh");
        a.setFileName("poi_1_oc_oanh.mp3");
        a.setDurationSeconds(145);
        a.setFileSizeBytes(2314350);
        a.setVoice("Nữ miền Nam (Truyền cảm)");
        a.setLanguage("vi");
        a.setZone("quan4");
        a.setTranscript("Chào mừng bạn đến với Quán Ốc Oanh. Nơi đây có ốc hương sốt trứng muối tuyệt ngon!");
        return a;
    }

    @Test
    void getAudioMetadata_returnsMetadataWithCues() {
        Long poiId = 1L;
        when(valueOperations.get(anyString())).thenReturn(null);
        when(audioRepository.findAudioByPoiId(poiId)).thenReturn(Optional.of(createSampleAudio(poiId)));

        Optional<AudioMetadataResponse> metaOpt = audioService.getAudioMetadata(poiId);

        assertThat(metaOpt).isPresent();
        AudioMetadataResponse meta = metaOpt.get();
        assertThat(meta.poiId()).isEqualTo(poiId);
        assertThat(meta.poiName()).isEqualTo("Quán Ốc Oanh");
        assertThat(meta.durationSeconds()).isEqualTo(145);
        assertThat(meta.durationFormatted()).isEqualTo("02:25");
        assertThat(meta.voice()).isEqualTo("Nữ miền Nam (Truyền cảm)");
        assertThat(meta.transcript()).contains("Quán Ốc Oanh");
        assertThat(meta.streamUrl()).isEqualTo("/api/v1/audio/stream/1");

        // Subtitle cues should be generated from sentences
        assertThat(meta.cues()).isNotEmpty();
        assertThat(meta.cues().get(0).startSeconds()).isEqualTo(0);
    }

    @Test
    void getAudioMetadata_returnsEmptyWhenNotFound() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(audioRepository.findAudioByPoiId(999L)).thenReturn(Optional.empty());

        Optional<AudioMetadataResponse> metaOpt = audioService.getAudioMetadata(999L);
        assertThat(metaOpt).isEmpty();
    }

    @Test
    void streamAudio_withoutRange_returns200FullContent() {
        Long poiId = 1L;
        when(audioRepository.findAudioByPoiId(poiId)).thenReturn(Optional.of(createSampleAudio(poiId)));

        ResponseEntity<byte[]> response = audioService.streamAudio(poiId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE)).isEqualTo("audio/mpeg");
        assertThat(response.getHeaders().getFirst(HttpHeaders.ACCEPT_RANGES)).isEqualTo("bytes");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isGreaterThan(0);
    }

    @Test
    void streamAudio_withValidRange_returns206PartialContent() {
        Long poiId = 1L;
        when(audioRepository.findAudioByPoiId(poiId)).thenReturn(Optional.of(createSampleAudio(poiId)));

        String rangeHeader = "bytes=0-1023";
        ResponseEntity<byte[]> response = audioService.streamAudio(poiId, rangeHeader);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PARTIAL_CONTENT);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE)).isEqualTo("audio/mpeg");
        assertThat(response.getHeaders().getFirst(HttpHeaders.ACCEPT_RANGES)).isEqualTo("bytes");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_LENGTH)).isEqualTo("1024");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE)).startsWith("bytes 0-1023/");
        assertThat(response.getBody()).hasSize(1024);
    }

    @Test
    void streamAudio_withInvalidRange_returns416() {
        Long poiId = 1L;
        when(audioRepository.findAudioByPoiId(poiId)).thenReturn(Optional.of(createSampleAudio(poiId)));

        String rangeHeader = "bytes=99999999-99999999";
        ResponseEntity<byte[]> response = audioService.streamAudio(poiId, rangeHeader);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE)).startsWith("bytes */");
    }

    @Test
    void streamAudio_returns404WhenAudioNotFound() {
        when(audioRepository.findAudioByPoiId(999L)).thenReturn(Optional.empty());

        ResponseEntity<byte[]> response = audioService.streamAudio(999L, "bytes=0-100");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void generateOfflinePack_createsValidZipWithManifest() throws Exception {
        String zone = "quan4";
        PoiAudio audio1 = createSampleAudio(1L);
        PoiAudio audio2 = createSampleAudio(2L);
        audio2.setFileName("poi_2_pha_lau_co_thao.mp3");
        audio2.setPoiName("Phá Lấu Cô Thảo");

        when(audioRepository.findAudiosByZone(zone)).thenReturn(List.of(audio1, audio2));

        Optional<byte[]> zipBytesOpt = audioService.generateOfflinePack(zone);

        assertThat(zipBytesOpt).isPresent();
        byte[] zipBytes = zipBytesOpt.get();
        assertThat(zipBytes.length).isGreaterThan(0);

        // Verify ZIP contents
        Set<String> entryNames = new HashSet<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entryNames.add(entry.getName());
                zis.closeEntry();
            }
        }

        assertThat(entryNames).contains(
                "manifest.json",
                "README.txt",
                "audio/poi_1_oc_oanh.mp3",
                "audio/poi_2_pha_lau_co_thao.mp3"
        );
    }

    @Test
    void generateOfflinePack_returnsEmptyWhenZoneHasNoAudios() {
        when(audioRepository.findAudiosByZone("unknown_zone")).thenReturn(List.of());

        Optional<byte[]> zipBytesOpt = audioService.generateOfflinePack("unknown_zone");
        assertThat(zipBytesOpt).isEmpty();
    }
}

