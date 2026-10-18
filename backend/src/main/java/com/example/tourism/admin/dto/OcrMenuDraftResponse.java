package com.example.tourism.admin.dto;

import java.util.List;

public record OcrMenuDraftResponse(
        Long poiId,
        String poiName,
        String fileName,
        int count,
        List<DetectedDishDraft> detectedDishes,
        String note
) {}

