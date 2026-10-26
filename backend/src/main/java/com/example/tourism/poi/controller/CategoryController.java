package com.example.tourism.poi.controller;

import com.example.tourism.poi.dto.CategoryRequest;
import com.example.tourism.poi.dto.CategoryResponse;
import com.example.tourism.poi.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@CrossOrigin(origins = "http://localhost:3000")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /api/v1/categories
     * Returns all food categories sorted by display order.
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    /**
     * GET /api/v1/categories/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    /**
     * POST /api/v1/categories
     * Thêm danh mục mới
     */
    @PostMapping
    public ResponseEntity<CategoryResponse> create(@RequestBody CategoryRequest req) {
        CategoryResponse created = categoryService.createCategory(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/categories/{id}
     * Cập nhật danh mục
     */
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id, @RequestBody CategoryRequest req) {
        CategoryResponse updated = categoryService.updateCategory(id, req);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/v1/categories/{id}
     * Xóa danh mục
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
