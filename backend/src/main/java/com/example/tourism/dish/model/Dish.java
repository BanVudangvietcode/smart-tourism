package com.example.tourism.dish.model;

import java.time.LocalDateTime;

public class Dish {
    private Long id;
    private Long poiId;
    private Long menuCategoryId;
    private String menuCategoryName;
    private String name;
    private String slug;
    private String description;
    private int price;
    private Integer originalPrice;
    private String unit;
    private boolean isSignature;
    private String thumbnailUrl;
    private String ingredients;
    private String allergens;
    private boolean hasPeanuts;
    private boolean hasSeafood;
    private boolean hasGluten;
    private boolean isAvailable = true;
    private int sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Dish() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public Long getMenuCategoryId() { return menuCategoryId; }
    public void setMenuCategoryId(Long menuCategoryId) { this.menuCategoryId = menuCategoryId; }

    public String getMenuCategoryName() { return menuCategoryName; }
    public void setMenuCategoryName(String menuCategoryName) { this.menuCategoryName = menuCategoryName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public Integer getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Integer originalPrice) { this.originalPrice = originalPrice; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public boolean isSignature() { return isSignature; }
    public void setSignature(boolean signature) { isSignature = signature; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getIngredients() { return ingredients; }
    public void setIngredients(String ingredients) { this.ingredients = ingredients; }

    public String getAllergens() { return allergens; }
    public void setAllergens(String allergens) { this.allergens = allergens; }

    public boolean isHasPeanuts() { return hasPeanuts; }
    public void setHasPeanuts(boolean hasPeanuts) { this.hasPeanuts = hasPeanuts; }

    public boolean isHasSeafood() { return hasSeafood; }
    public void setHasSeafood(boolean hasSeafood) { this.hasSeafood = hasSeafood; }

    public boolean isHasGluten() { return hasGluten; }
    public void setHasGluten(boolean hasGluten) { this.hasGluten = hasGluten; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
