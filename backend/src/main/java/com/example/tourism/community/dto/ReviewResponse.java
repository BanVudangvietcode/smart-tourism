package com.example.tourism.community.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewResponse(
        Long id,
        Long poiId,
        Long userId,
        String userDisplayName,
        String userAvatarUrl,
        Integer rating,
        String comment,
        List<String> images,
        LocalDateTime createdAt
) {}

