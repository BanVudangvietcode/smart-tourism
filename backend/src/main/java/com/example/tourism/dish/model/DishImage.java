package com.example.tourism.dish.model;

public class DishImage {
    private Long id;
    private Long dishId;
    private String url;
    private String caption;
    private boolean isCloseUp;
    private int sortOrder;

    public DishImage() {}

    public DishImage(Long id, Long dishId, String url, String caption, boolean isCloseUp, int sortOrder) {
        this.id = id;
        this.dishId = dishId;
        this.url = url;
        this.caption = caption;
        this.isCloseUp = isCloseUp;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDishId() { return dishId; }
    public void setDishId(Long dishId) { this.dishId = dishId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public boolean isCloseUp() { return isCloseUp; }
    public void setCloseUp(boolean closeUp) { isCloseUp = closeUp; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
