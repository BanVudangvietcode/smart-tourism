package com.example.tourism.dish.model;

import java.time.LocalDateTime;

public class MenuCategory {
    private Long id;
    private Long poiId;
    private String name;
    private int sortOrder;
    private LocalDateTime createdAt;

    public MenuCategory() {}

    public MenuCategory(Long id, Long poiId, String name, int sortOrder) {
        this.id = id;
        this.poiId = poiId;
        this.name = name;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
