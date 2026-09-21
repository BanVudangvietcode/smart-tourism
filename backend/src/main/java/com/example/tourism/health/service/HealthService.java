package com.example.tourism.health.service;

import com.example.tourism.health.dto.HealthResponse;
import com.example.tourism.health.repository.HealthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;

@Service
public class HealthService {

    private final HealthRepository healthRepository;
    private final Clock clock;

    @Autowired
    public HealthService(HealthRepository healthRepository) {
        this(healthRepository, Clock.systemUTC());
    }

    HealthService(HealthRepository healthRepository, Clock clock) {
        this.healthRepository = healthRepository;
        this.clock = clock;
    }

    public HealthResponse getHealth() {
        boolean databaseAvailable = healthRepository.isDatabaseAvailable();

        return new HealthResponse(
                databaseAvailable ? "UP" : "DOWN",
                databaseAvailable ? "CONNECTED" : "DISCONNECTED",
                Instant.now(clock)
        );
    }
}
