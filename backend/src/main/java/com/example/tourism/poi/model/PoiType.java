package com.example.tourism.poi.model;

import java.time.LocalDateTime;

public class PoiType {
    private String code;
    private String name;
    private String nameEn;
    private String icon;
    private String description;
    private String descriptionEn;
    private int sortOrder;
    private LocalDateTime createdAt;

    public PoiType() {}

    public PoiType(String code, String name, String icon, String description, int sortOrder, LocalDateTime createdAt) {
        this.code = code;
        this.name = name;
        this.icon = icon;
        this.description = description;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
