package com.example.tourism.health.service;

import com.example.tourism.health.dto.HealthResponse;
import com.example.tourism.health.repository.HealthRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthServiceTest {

    @Test
    void reportsUpWhenDatabaseIsAvailable() {
        HealthRepository repository = mock(HealthRepository.class);
        when(repository.isDatabaseAvailable()).thenReturn(true);
        Instant now = Instant.parse("2026-09-21T00:00:00Z");
        HealthService service = new HealthService(repository, Clock.fixed(now, ZoneOffset.UTC));

        HealthResponse response = service.getHealth();

        assertThat(response.status()).isEqualTo("UP");
        assertThat(response.database()).isEqualTo("CONNECTED");
        assertThat(response.timestamp()).isEqualTo(now);
    }
}
