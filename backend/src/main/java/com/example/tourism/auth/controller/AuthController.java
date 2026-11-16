package com.example.tourism.auth.controller;

import com.example.tourism.auth.dto.*;
import com.example.tourism.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(originPatterns = "*")
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

    /**
     * Đăng nhập quyền Quản trị viên (ROLE_ADMIN) cho trang Admin CMS (yêu cầu tài khoản & mật khẩu).
     */
    @PostMapping("/api/v1/auth/admin-login")
    public ResponseEntity<AuthResponse> loginAsAdmin(@Valid @RequestBody AdminLoginRequest request) {
        AuthResponse response = authService.loginAsAdmin(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * Gửi OTP qua Telegram (hỗ trợ Deep Link và tự động gửi nếu đã liên kết).
     */
    @PostMapping("/api/v1/auth/telegram/request-otp")
    public ResponseEntity<Map<String, Object>> requestTelegramOtp(@Valid @RequestBody OtpRequest request) {
        AuthService.OtpRequestResult result = authService.requestOtp(request.getPhone());
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", result.status());
        response.put("message", result.message());
        if (result.telegramBotUrl() != null) {
            response.put("telegramBotUrl", result.telegramBotUrl());
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Xác thực OTP, trả về JWT đầy đủ (userId, role...) giống Google/Guest.
     */
    @PostMapping("/api/v1/auth/telegram/verify-otp")
    public ResponseEntity<AuthResponse> verifyTelegramOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    // ──────────────────────────────────────────────
    // Legacy OTP API (kept for backward compatibility)
    // ──────────────────────────────────────────────

    @PostMapping("/api/auth/request-otp")
    public ResponseEntity<Map<String, Object>> requestOtp(@Valid @RequestBody OtpRequest request) {
        AuthService.OtpRequestResult result = authService.requestOtp(request.getPhone());
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", result.status());
        response.put("message", result.message());
        if (result.telegramBotUrl() != null) {
            response.put("telegramBotUrl", result.telegramBotUrl());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(response);
    }
}
