package com.example.tourism.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiRecommendDishRequest {

    private Integer budget;
    private List<String> tastePreferences = new ArrayList<>();
    private Integer groupSize;
    private Double userLat;
    private Double userLng;

    public AiRecommendDishRequest() {
    }

    public AiRecommendDishRequest(Integer budget, List<String> tastePreferences, Integer groupSize, Double userLat, Double userLng) {
        this.budget = budget;
        this.tastePreferences = tastePreferences != null ? tastePreferences : new ArrayList<>();
        this.groupSize = groupSize;
        this.userLat = userLat;
        this.userLng = userLng;
    }

    public Integer getBudget() {
        return budget;
    }

    public void setBudget(Integer budget) {
        this.budget = budget;
    }

    public List<String> getTastePreferences() {
        return tastePreferences;
    }

    public void setTastePreferences(List<String> tastePreferences) {
        this.tastePreferences = tastePreferences != null ? tastePreferences : new ArrayList<>();
    }

    public Integer getGroupSize() {
        return groupSize;
    }

    public void setGroupSize(Integer groupSize) {
        this.groupSize = groupSize;
    }

    public Double getUserLat() {
        return userLat;
    }

    public void setUserLat(Double userLat) {
        this.userLat = userLat;
    }

    public Double getUserLng() {
        return userLng;
    }

    public void setUserLng(Double userLng) {
        this.userLng = userLng;
    }
}

