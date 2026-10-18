package com.example.tourism.admin.dto;

import java.util.List;

public record EvictCacheResponse(
        String pattern,
        long evictedCount,
        List<String> evictedKeys,
        String message
) {}

