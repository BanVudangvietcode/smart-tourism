package com.example.tourism.tour.model;

import java.time.LocalDateTime;

/**
 * Entity representing an individual waypoint / stop within a tour.
 */
public class TourStop {
    private Long id;
    private Long tourId;
    private Long poiId;
    private int stopOrder;
    private int estimatedDurationMinutes;
    private String recommendedDishOrActivity;
    private String note;
    private LocalDateTime createdAt;

    public TourStop() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTourId() { return tourId; }
    public void setTourId(Long tourId) { this.tourId = tourId; }

    public Long getPoiId() { return poiId; }
    public void setPoiId(Long poiId) { this.poiId = poiId; }

    public int getStopOrder() { return stopOrder; }
    public void setStopOrder(int stopOrder) { this.stopOrder = stopOrder; }

    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(int estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }

    public String getRecommendedDishOrActivity() { return recommendedDishOrActivity; }
    public void setRecommendedDishOrActivity(String recommendedDishOrActivity) { this.recommendedDishOrActivity = recommendedDishOrActivity; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

