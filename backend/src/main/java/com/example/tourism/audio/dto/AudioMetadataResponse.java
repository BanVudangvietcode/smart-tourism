package com.example.tourism.audio.dto;

import java.util.List;

/**
 * Metadata for a POI audio guide including duration, file size, voice/narrator,
 * full transcript, and timed subtitle cues.
 */
public record AudioMetadataResponse(
        Long poiId,
        String poiName,
        String title,
        int durationSeconds,
        String durationFormatted,
        long fileSizeBytes,
        String fileSizeFormatted,
        String voice,
        String language,
        String transcript,
        String streamUrl,
        List<SubtitleCue> cues
) {}

