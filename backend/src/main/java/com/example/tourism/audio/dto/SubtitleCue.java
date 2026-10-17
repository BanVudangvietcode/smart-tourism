package com.example.tourism.audio.dto;

/**
 * Represents a timed subtitle cue for synchronized subtitle display on mobile.
 */
public record SubtitleCue(
        int startSeconds,
        int endSeconds,
        String text
) {}

