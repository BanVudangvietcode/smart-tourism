package com.example.tourism.poi.service;

import com.example.tourism.poi.dto.CategoryRequest;
import com.example.tourism.poi.dto.CategoryResponse;
import com.example.tourism.poi.model.Category;
import com.example.tourism.poi.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục id=" + id));
    }

    public CategoryResponse createCategory(CategoryRequest req) {
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống");
        }
        int sortOrder = categoryRepository.getNextSortOrder();
        Long id = categoryRepository.create(req.name().trim(), req.slug(), req.iconUrl(), sortOrder);
        return getCategoryById(id);
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest req) {
        categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục id=" + id));

        categoryRepository.update(id, req.name(), req.slug(), req.iconUrl(), req.sortOrder());
        return getCategoryById(id);
    }

    public void deleteCategory(Long id) {
        categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục id=" + id));

        categoryRepository.delete(id);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getIconUrl(), c.getSortOrder());
    }
}
