package com.example.tourism.admin.dto;

import java.util.List;

public record BatchImportResponse(
        Long poiId,
        String poiName,
        String fileName,
        int importedCount,
        List<String> importedDishNames,
        String message
) {}

