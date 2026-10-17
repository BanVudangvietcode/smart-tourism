package com.example.tourism.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiAskResponse {

    private String answer;
    private Long poiId;
    private String poiName;
    private String conversationId;
    private Double distanceMeters;
    private List<String> suggestedFollowUps = new ArrayList<>();

    public AiAskResponse() {
    }

    public AiAskResponse(String answer, Long poiId, String poiName, String conversationId,
                         Double distanceMeters, List<String> suggestedFollowUps) {
        this.answer = answer;
        this.poiId = poiId;
        this.poiName = poiName;
        this.conversationId = conversationId;
        this.distanceMeters = distanceMeters;
        this.suggestedFollowUps = suggestedFollowUps != null ? suggestedFollowUps : new ArrayList<>();
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
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

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public List<String> getSuggestedFollowUps() {
        return suggestedFollowUps;
    }

    public void setSuggestedFollowUps(List<String> suggestedFollowUps) {
        this.suggestedFollowUps = suggestedFollowUps != null ? suggestedFollowUps : new ArrayList<>();
    }
}

