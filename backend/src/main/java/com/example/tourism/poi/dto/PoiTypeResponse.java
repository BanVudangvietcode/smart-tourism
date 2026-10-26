package com.example.tourism.poi.dto;

import com.example.tourism.poi.model.PoiType;
import java.time.LocalDateTime;

public record PoiTypeResponse(
        String code,
        String name,
        String icon,
        String description,
        int sortOrder,
        LocalDateTime createdAt
) {
    public static PoiTypeResponse from(PoiType p) {
        return new PoiTypeResponse(
                p.getCode(),
                p.getName(),
                p.getIcon(),
                p.getDescription(),
                p.getSortOrder(),
                p.getCreatedAt()
        );
    }
}
