package com.example.tourism.tour.controller;

import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.tour.dto.*;
import com.example.tourism.tour.service.TourService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tours")
@CrossOrigin(origins = "http://localhost:3000")
public class TourController {

    private final TourService tourService;

    public TourController(TourService tourService) {
        this.tourService = tourService;
    }

    /**
     * GET /api/v1/tours
     * Retrieves list of available curated and custom tours with optional filters:
     * - theme: Filter by theme ('FOOD', 'CULTURE', 'RELIGIOUS', 'LANDMARK', 'MIXED')
     * - isPublic: Filter by visibility (true/false)
     * - userId: Filter by creator user ID (includes their private tours)
     * - search: Full-text search by name or description
     */
    @GetMapping
    public ResponseEntity<List<TourSummaryResponse>> getTours(
            @RequestParam(required = false) String theme,
            @RequestParam(required = false) Boolean isPublic,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String search,
            @CurrentUser AuthUser authUser) {

        Long effectiveUserId = userId != null ? userId : (authUser != null ? authUser.id() : null);
        List<TourSummaryResponse> results = tourService.getTours(theme, isPublic, effectiveUserId, search);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/v1/tours/{tourId}
     * Retrieves detailed tour itinerary (waypoints, estimated duration, cost, notes).
     * Supports both numeric ID and slug.
     */
    @GetMapping("/{tourId}")
    public ResponseEntity<TourDetailResponse> getTourById(
            @PathVariable String tourId,
            @CurrentUser AuthUser authUser) {

        Long currentUserId = authUser != null ? authUser.id() : null;
        TourDetailResponse detail = tourService.getTourByIdOrSlug(tourId, currentUserId);
        return ResponseEntity.ok(detail);
    }

    /**
     * POST /api/v1/tours
     * Create a new tour. Admins can create curated public tours;
     * users can create custom public or private tours.
     * Uses Jakarta Validation (@Valid) and Custom Argument Resolver (@CurrentUser).
     */
    @PostMapping
    public ResponseEntity<TourDetailResponse> createTour(
            @Valid @RequestBody CreateTourRequest requestBody,
            @CurrentUser AuthUser authUser) {

        Long currentUserId = authUser != null ? authUser.id() : null;
        String currentRole = authUser != null ? authUser.role() : null;

        TourDetailResponse created = tourService.createTour(requestBody, currentUserId, currentRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * POST /api/v1/tours/custom-plan
     * Automatically constructs a personalized tour based on available free time and location.
     * Uses Jakarta Validation (@Valid) and Custom Argument Resolver (@CurrentUser).
     */
    @PostMapping("/custom-plan")
    public ResponseEntity<CustomPlanResponse> generateCustomPlan(
            @Valid @RequestBody CustomPlanRequest requestBody,
            @CurrentUser AuthUser authUser) {

        Long currentUserId = authUser != null ? authUser.id() : null;
        String currentRole = authUser != null ? authUser.role() : null;

        CustomPlanResponse plan = tourService.generateCustomPlan(requestBody, currentUserId, currentRole);
        return ResponseEntity.ok(plan);
    }
}
