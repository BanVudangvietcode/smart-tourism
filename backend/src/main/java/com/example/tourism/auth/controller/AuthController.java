package com.example.tourism.auth.controller;

import com.example.tourism.auth.dto.*;
import com.example.tourism.auth.service.AuthService;
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
    public ResponseEntity<?> createGuestSession(@RequestBody GuestSessionRequest request) {
        try {
            AuthResponse response = authService.createGuestSession(
                    request.getDeviceId(), request.getOs());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    /**
     * Đăng nhập 1-chạm bằng tài khoản Google.
     */
    @PostMapping("/api/v1/auth/oauth2/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleOAuth2Request request) {
        try {
            AuthResponse response = authService.loginWithGoogle(request.getIdToken(), request.getDeviceId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ──────────────────────────────────────────────
    // Legacy OTP API (kept for backward compatibility)
    // ──────────────────────────────────────────────

    @PostMapping("/api/auth/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest request) {
        try {
            authService.generateAndSendOtp(request.getPhone());
            return ResponseEntity.ok(Map.of("message", "OTP đã được gửi thành công qua Telegram!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        try {
            AuthResponse response = authService.verifyOtp(request.getPhone(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
