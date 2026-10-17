package com.example.tourism.dish.dto;

import java.util.List;

/**
 * Full menu response for a POI, categorized by menu sections (Món ăn chơi, Món chính, Đồ uống).
 */
public record PoiMenuResponse(
        Long poiId,
        String poiName,
        int totalDishes,
        List<MenuCategoryGroupResponse> categories
) {}
