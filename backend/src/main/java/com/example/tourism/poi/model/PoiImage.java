package com.example.tourism.poi.model;

public class PoiImage {
    private Long id;
    private Long poiId;
    private String url;
    private String caption;
    private int sortOrder;

    public PoiImage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
