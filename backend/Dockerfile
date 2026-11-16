# ==============================================================================
# Multi-stage Dockerfile for Spring Boot 3.5 (Java 17)
# Optimized for free cloud hosting (Render, Railway, Fly.io, Koyeb)
# ==============================================================================

# Stage 1: Build Application with Maven & JDK 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# 1. Cache Maven dependencies first (Layer Caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy source code and build production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal Production Runtime with JRE 17 Alpine
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a dedicated non-root user for security best practices
RUN addgroup -S spring && adduser -S spring -G spring

# Create directories for upload storage and give spring user ownership
RUN mkdir -p /app/src/main/resources/images/pois /app/target/classes/images/pois /app/backend/src/main/resources/images/pois \
    && chown -R spring:spring /app

# Copy compiled JAR and static images from builder stage
COPY --from=builder --chown=spring:spring /build/target/*.jar app.jar
COPY --from=builder --chown=spring:spring /build/src/main/resources/images ./src/main/resources/images

USER spring:spring

# Configuration for Render Free Tier (512MB RAM):
# - Heap is capped at 384MB (-Xmx384m) to leave >= 128MB for Metaspace, thread stacks & OS kernel
# - Serial GC (-XX:+UseSerialGC) minimizes GC metadata footprint on single-core / low-RAM instances
# - Port is injected dynamically by Render ($PORT), defaulting to 8080
ENV PORT=8080 \
    JAVA_OPTS="-Xmx384m -Xms256m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
