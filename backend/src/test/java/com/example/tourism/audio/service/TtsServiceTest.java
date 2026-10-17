package com.example.tourism.audio.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TtsServiceTest {

    private TtsService ttsService;

    @BeforeEach
    void setUp() {
        ttsService = new TtsService();
    }

    @Test
    void estimateDurationSeconds_estimatesCorrectly() {
        String shortText = "Chào mừng quý khách đến với di tích Bến Nhà Rồng.";
        int seconds = ttsService.estimateDurationSeconds(shortText);
        assertThat(seconds).isGreaterThanOrEqualTo(5);

        String longText = "Bến Nhà Rồng là nơi Bác Hồ ra đi tìm đường cứu nước năm 1911. ".repeat(10);
        int longSeconds = ttsService.estimateDurationSeconds(longText);
        assertThat(longSeconds).isGreaterThan(seconds);
    }

    @Test
    void generateSpeech_returnsNonEmptyBytesForText() {
        String text = "Xin chào mừng du khách đến tham quan phố ẩm thực và danh lam thắng cảnh Quận 4.";
        byte[] bytes = ttsService.generateSpeech(text, "vi");

        assertThat(bytes).isNotNull();
        assertThat(bytes.length).isGreaterThan(500);
    }

    @Test
    void generateSyntheticMp3Frames_generatesValidAudioFrames() {
        byte[] frames = ttsService.generateSyntheticMp3Frames(10, 128);
        assertThat(frames).isNotNull();
        assertThat(frames.length).isGreaterThan(1000);
        // Header bytes for MPEG-1 Layer 3
        assertThat(frames[0]).isEqualTo((byte) 0xFF);
        assertThat(frames[1]).isEqualTo((byte) 0xFB);
    }
}

