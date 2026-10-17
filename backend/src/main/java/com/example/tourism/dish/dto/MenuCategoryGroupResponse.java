package com.example.tourism.dish.dto;

import java.util.List;

/**
 * Represents a menu category group (e.g. Món ăn chơi, Món chính, Đồ uống) containing its dishes.
 */
public record MenuCategoryGroupResponse(
        Long categoryId,
        String categoryName,
        int sortOrder,
        List<DishSummaryResponse> dishes
) {}
