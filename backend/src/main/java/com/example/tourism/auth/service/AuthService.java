package com.example.tourism.auth.service;

import com.example.tourism.auth.dto.AuthResponse;
import com.example.tourism.auth.util.JwtUtils;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final TelegramBotService telegramBotService;
    private final JwtUtils jwtUtils;

    // Lưu trữ tạm thời mã OTP. Trong thực tế nên dùng Redis và set thời gian hết hạn (TTL).
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public AuthService(TelegramBotService telegramBotService, JwtUtils jwtUtils) {
        this.telegramBotService = telegramBotService;
        this.jwtUtils = jwtUtils;
    }

    public void generateAndSendOtp(String phone) {
        // Tạo mã OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Lưu vào bộ nhớ (ghi đè nếu SĐT đang yêu cầu lại)
        otpStorage.put(phone, otp);
        
        // Gửi qua Telegram
        telegramBotService.sendOtpMessage(phone, otp);
    }

    public AuthResponse verifyOtp(String phone, String otp) {
        String storedOtp = otpStorage.get(phone);
        
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        
        // Xác nhận thành công -> xoá OTP
        otpStorage.remove(phone);
        
        // Tạo JWT Token
        String token = jwtUtils.generateJwtToken(phone);
        
        return new AuthResponse(token, phone);
    }
}
