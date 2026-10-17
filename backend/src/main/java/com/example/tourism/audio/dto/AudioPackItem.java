package com.example.tourism.audio.dto;

public record AudioPackItem(
        Long poiId,
        String poiName,
        String title,
        String fileName,
        int durationSeconds,
        long fileSizeBytes,
        String voice,
        String transcript
) {}

