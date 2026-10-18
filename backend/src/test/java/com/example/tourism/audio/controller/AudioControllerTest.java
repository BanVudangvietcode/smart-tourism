package com.example.tourism.audio.controller;

import com.example.tourism.audio.dto.AudioMetadataResponse;
import com.example.tourism.audio.service.AudioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AudioControllerTest {

    private MockMvc mockMvc;
    private AudioService audioService;

    @BeforeEach
    void setUp() {
        audioService = mock(AudioService.class);
        AudioController controller = new AudioController(audioService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new com.example.tourism.common.exception.GlobalExceptionHandler())
                .build();
    }

    @Test
    void streamAudio_returnsPartialContent() throws Exception {
        Long poiId = 1L;
        String rangeHeader = "bytes=0-100";
        byte[] chunk = new byte[101];

        ResponseEntity<byte[]> response = ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes 0-100/1000")
                .header(HttpHeaders.CONTENT_LENGTH, "101")
                .body(chunk);

        when(audioService.streamAudio(poiId, rangeHeader)).thenReturn(response);

        mockMvc.perform(get("/api/v1/audio/stream/{poiId}", poiId)
                        .header("Range", rangeHeader))
                .andExpect(status().isPartialContent())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().string(HttpHeaders.CONTENT_RANGE, "bytes 0-100/1000"));
    }

    @Test
    void getMetadata_returnsAudioMetadata() throws Exception {
        Long poiId = 1L;
        AudioMetadataResponse metadata = new AudioMetadataResponse(
                poiId, "Quán Ốc Oanh", "Thuyết minh Quán Ốc Oanh",
                145, "02:25", 2314350, "2.21 MB",
                "Nữ miền Nam (Truyền cảm)", "vi",
                "Chào mừng bạn đến với Quán Ốc Oanh",
                "/api/v1/audio/stream/1",
                List.of()
        );

        when(audioService.getAudioMetadata(poiId)).thenReturn(Optional.of(metadata));

        mockMvc.perform(get("/api/v1/audio/metadata/{poiId}", poiId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(poiId))
                .andExpect(jsonPath("$.poiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.durationSeconds").value(145))
                .andExpect(jsonPath("$.durationFormatted").value("02:25"))
                .andExpect(jsonPath("$.voice").value("Nữ miền Nam (Truyền cảm)"))
                .andExpect(jsonPath("$.streamUrl").value("/api/v1/audio/stream/1"));
    }

    @Test
    void getOfflinePack_returnsZipAttachment() throws Exception {
        String zone = "quan4";
        byte[] dummyZip = "PK dummy zip content".getBytes();

        when(audioService.generateOfflinePack(zone)).thenReturn(Optional.of(dummyZip));

        mockMvc.perform(get("/api/v1/audio/offline-pack").param("zone", zone))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audio_pack_quan4.zip\""))
                .andExpect(content().bytes(dummyZip));
    }

    @Test
    void generateFromText_returnsCreatedAudio() throws Exception {
        Long poiId = 3L;
        com.example.tourism.audio.dto.AudioCreateResponse res =
                new com.example.tourism.audio.dto.AudioCreateResponse(
                        10L, poiId, "Bến Nhà Rồng", "Thuyết minh Bến Nhà Rồng",
                        "poi_3.mp3", 85, "01:25", 510000, "498.05 KB",
                        "Nữ miền Nam", "vi", "quan4",
                        "Nội dung thuyết minh Bến Nhà Rồng",
                        "/api/v1/audio/stream/3", "TEXT_TO_SPEECH", List.of()
                );

        when(audioService.generateAudioFromText(org.mockito.ArgumentMatchers.any())).thenReturn(res);

        String jsonBody = """
                {
                    "poiId": 3,
                    "title": "Thuyết minh Bến Nhà Rồng",
                    "transcript": "Nội dung thuyết minh Bến Nhà Rồng",
                    "voice": "Nữ miền Nam",
                    "zone": "quan4"
                }
                """;

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/audio/generate-from-text")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(poiId))
                .andExpect(jsonPath("$.poiName").value("Bến Nhà Rồng"))
                .andExpect(jsonPath("$.creationMode").value("TEXT_TO_SPEECH"))
                .andExpect(jsonPath("$.streamUrl").value("/api/v1/audio/stream/3"));
    }

    @Test
    void uploadCustomAudio_returnsCreatedAudio() throws Exception {
        Long poiId = 4L;
        com.example.tourism.audio.dto.AudioCreateResponse res =
                new com.example.tourism.audio.dto.AudioCreateResponse(
                        11L, poiId, "Nhà thờ Xóm Chiếu", "Thuyết minh Nhà thờ Xóm Chiếu",
                        "poi_4.mp3", 75, "01:15", 450000, "439.45 KB",
                        "Tự thu âm", "vi", "quan4",
                        "Nội dung thuyết minh Nhà thờ Xóm Chiếu",
                        "/api/v1/audio/stream/4", "DIRECT_UPLOAD", List.of()
                );

        when(audioService.uploadCustomAudio(
                org.mockito.ArgumentMatchers.eq(poiId),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(res);

        org.springframework.mock.web.MockMultipartFile file =
                new org.springframework.mock.web.MockMultipartFile("file", "xomchieu.mp3", "audio/mpeg", new byte[1000]);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/audio/upload")
                        .file(file)
                        .param("poiId", "4")
                        .param("title", "Thuyết minh Nhà thờ Xóm Chiếu")
                        .param("transcript", "Nội dung thuyết minh Nhà thờ Xóm Chiếu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(poiId))
                .andExpect(jsonPath("$.poiName").value("Nhà thờ Xóm Chiếu"))
                .andExpect(jsonPath("$.creationMode").value("DIRECT_UPLOAD"));
    }
}

