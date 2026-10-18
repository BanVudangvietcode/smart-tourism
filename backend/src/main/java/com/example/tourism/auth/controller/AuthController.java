package com.example.tourism.auth.controller;

import com.example.tourism.auth.dto.*;
import com.example.tourism.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ──────────────────────────────────────────────
    // V1 API: Guest / Register / Login / OAuth2
    // ──────────────────────────────────────────────

    /**
     * Cấp JWT Token vô danh cho khách vừa mở app mà chưa cần đăng nhập.
     * Giúp gán các sự kiện nghe audio, vị trí bước đi vào đúng thiết bị này.
     */
    @PostMapping("/api/v1/auth/guest-session")
    public ResponseEntity<AuthResponse> createGuestSession(@Valid @RequestBody GuestSessionRequest request) {
        AuthResponse response = authService.createGuestSession(request.getDeviceId(), request.getOs());
        return ResponseEntity.ok(response);
    }

    /**
     * Đăng nhập 1-chạm bằng tài khoản Google.
     */
    @PostMapping("/api/v1/auth/oauth2/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleOAuth2Request request) {
        AuthResponse response = authService.loginWithGoogle(request.getIdToken(), request.getDeviceId());
        return ResponseEntity.ok(response);
    }

    // ──────────────────────────────────────────────
    // Legacy OTP API (kept for backward compatibility)
    // ──────────────────────────────────────────────

    @PostMapping("/api/auth/request-otp")
    public ResponseEntity<Map<String, String>> requestOtp(@Valid @RequestBody OtpRequest request) {
        authService.generateAndSendOtp(request.getPhone());
        return ResponseEntity.ok(Map.of("message", "OTP đã được gửi thành công qua Telegram!"));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(response);
    }
}
