package com.example.tourism.audio.dto;

import java.util.List;

/**
 * Manifest included inside the offline-pack ZIP bundle.
 */
public record AudioPackManifest(
        String zone,
        int totalAudios,
        long totalSizeBytes,
        String generatedAt,
        List<AudioPackItem> items
) {}

