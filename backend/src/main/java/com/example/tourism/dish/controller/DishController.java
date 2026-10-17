package com.example.tourism.dish.controller;

import com.example.tourism.dish.dto.DishDetailResponse;
import com.example.tourism.dish.service.DishService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dishes")
@CrossOrigin(origins = "http://localhost:3000")
public class DishController {

    private final DishService dishService;

    public DishController(DishService dishService) {
        this.dishService = dishService;
    }

    /**
     * GET /api/v1/dishes/{dishId}
     * Returns full dish detail: description, close-up images,
     * primary ingredients, and allergen warnings (peanuts, seafood, gluten).
     * Cached on Redis with 30-minute TTL.
     */
    @GetMapping("/{dishId}")
    public ResponseEntity<DishDetailResponse> getById(@PathVariable Long dishId) {
        return dishService.getDishDetail(dishId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
