package com.example.tourism.ai.dto;

public class AiAskRequest {

    private Long poiId;
    private String question;
    private Double userLat;
    private Double userLng;
    private String conversationId;

    public AiAskRequest() {
    }

    public AiAskRequest(Long poiId, String question, Double userLat, Double userLng, String conversationId) {
        this.poiId = poiId;
        this.question = question;
        this.userLat = userLat;
        this.userLng = userLng;
        this.conversationId = conversationId;
    }

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
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

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
}

