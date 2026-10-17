package com.example.tourism.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiRecommendDishResponse {

    private String summary;
    private Integer totalEstimatedPrice;
    private Integer budgetRemaining;
    private List<RecommendedDishItem> dishes = new ArrayList<>();
    private String tips;

    public AiRecommendDishResponse() {
    }

    public AiRecommendDishResponse(String summary, Integer totalEstimatedPrice, Integer budgetRemaining,
                                   List<RecommendedDishItem> dishes, String tips) {
        this.summary = summary;
        this.totalEstimatedPrice = totalEstimatedPrice;
        this.budgetRemaining = budgetRemaining;
        this.dishes = dishes != null ? dishes : new ArrayList<>();
        this.tips = tips;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Integer getTotalEstimatedPrice() {
        return totalEstimatedPrice;
    }

    public void setTotalEstimatedPrice(Integer totalEstimatedPrice) {
        this.totalEstimatedPrice = totalEstimatedPrice;
    }

    public Integer getBudgetRemaining() {
        return budgetRemaining;
    }

    public void setBudgetRemaining(Integer budgetRemaining) {
        this.budgetRemaining = budgetRemaining;
    }

    public List<RecommendedDishItem> getDishes() {
        return dishes;
    }

    public void setDishes(List<RecommendedDishItem> dishes) {
        this.dishes = dishes != null ? dishes : new ArrayList<>();
    }

    public String getTips() {
        return tips;
    }

    public void setTips(String tips) {
        this.tips = tips;
    }
}

