package com.example.tourism.ai.dto;

public class RecommendedDishItem {

    private Long dishId;
    private String dishName;
    private Long poiId;
    private String poiName;
    private Integer price;
    private String unit;
    private String imageUrl;
    private Boolean isSignature;
    private String reason;

    public RecommendedDishItem() {
    }

    public RecommendedDishItem(Long dishId, String dishName, Long poiId, String poiName,
                               Integer price, String unit, String imageUrl,
                               Boolean isSignature, String reason) {
        this.dishId = dishId;
        this.dishName = dishName;
        this.poiId = poiId;
        this.poiName = poiName;
        this.price = price;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.isSignature = isSignature;
        this.reason = reason;
    }

    public Long getDishId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
    }

    public String getDishName() {
        return dishName;
    }

    public void setDishName(String dishName) {
        this.dishName = dishName;
    }

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public String getPoiName() {
        return poiName;
    }

    public void setPoiName(String poiName) {
        this.poiName = poiName;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsSignature() {
        return isSignature;
    }

    public void setIsSignature(Boolean isSignature) {
        this.isSignature = isSignature;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

