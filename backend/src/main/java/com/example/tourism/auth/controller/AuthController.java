package com.example.tourism.auth.controller;

import com.example.tourism.auth.dto.AuthResponse;
import com.example.tourism.auth.dto.OtpRequest;
import com.example.tourism.auth.dto.OtpVerifyRequest;
import com.example.tourism.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Cho phép frontend gọi API này
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest request) {
        try {
            authService.generateAndSendOtp(request.getPhone());
            return ResponseEntity.ok(Map.of("message", "OTP đã được gửi thành công qua Telegram!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        try {
            AuthResponse response = authService.verifyOtp(request.getPhone(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
