# ==============================================================================
# Multi-stage Dockerfile for Spring Boot 3.5 (Java 17)
# Optimized for free cloud hosting (Render, Railway, Koyeb, Fly.io)
# ==============================================================================

# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directory for upload storage
RUN mkdir -p /app/backend/src/main/resources/images/pois /app/target/classes/images/pois \
    && chown -R appuser:appgroup /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar
COPY --from=builder /app/src/main/resources/images ./src/main/resources/images

USER appuser

ENV PORT=8080
EXPOSE 8080

# Configure memory limits for free tier (512MB RAM)
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
