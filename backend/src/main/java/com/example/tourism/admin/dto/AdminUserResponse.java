package com.example.tourism.admin.dto;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String email,
        String displayName,
        String avatarUrl,
        String provider,
        String providerId,
        String role,
        boolean locked,
        long listenCount,
        long checkinCount,
        LocalDateTime createdAt
) {}
