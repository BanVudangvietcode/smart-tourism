package com.example.tourism.ai.dto;

import java.util.List;

/**
 * Response payload for voice-enabled AI Q&A (Push-to-Talk).
 * Contains both the transcribed question, AI answer, and optional voice audio stream URL.
 */
public record AiVoiceAskResponse(
        Long poiId,
        String poiName,
        String transcribedQuestion,
        String answer,
        String audioResponseUrl,
        String conversationId,
        Double distanceMeters,
        List<String> suggestedFollowUps
) {}

