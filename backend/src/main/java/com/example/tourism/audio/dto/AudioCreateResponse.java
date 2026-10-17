package com.example.tourism.audio.dto;

import java.util.List;

/**
 * Phản hồi sau khi tạo âm thanh thành công (từ Text hoặc từ file tải lên).
 */
public record AudioCreateResponse(
        Long id,
        Long poiId,
        String poiName,
        String title,
        String fileName,
        int durationSeconds,
        String durationFormatted,
        long fileSizeBytes,
        String fileSizeFormatted,
        String voice,
        String language,
        String zone,
        String transcript,
        String streamUrl,
        String creationMode,
        List<SubtitleCue> cues
) {}

