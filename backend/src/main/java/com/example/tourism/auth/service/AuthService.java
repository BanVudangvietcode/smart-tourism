package com.example.tourism.auth.service;

import com.example.tourism.auth.dto.AuthResponse;
import com.example.tourism.auth.util.JwtUtils;
import com.example.tourism.user.model.User;
import com.example.tourism.user.repository.GuestDeviceRepository;
import com.example.tourism.user.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.util.Collections;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final TelegramBotService telegramBotService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final GuestDeviceRepository guestDeviceRepository;

    @Value("${google.oauth2.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier googleVerifier;

    // Lưu trữ tạm thời mã OTP. Trong thực tế nên dùng Redis và set thời gian hết hạn (TTL).
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public AuthService(TelegramBotService telegramBotService, JwtUtils jwtUtils,
                       UserRepository userRepository, GuestDeviceRepository guestDeviceRepository) {
        this.telegramBotService = telegramBotService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.guestDeviceRepository = guestDeviceRepository;
    }

    @PostConstruct
    public void initGoogleVerifier() {
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    // ──────────────────────────────────────────────
    // Guest Session
    // ──────────────────────────────────────────────

    /**
     * Cấp JWT Token vô danh cho khách vừa mở app.
     * Nếu deviceId đã tồn tại, trả lại token cho user cũ.
     */
    public AuthResponse createGuestSession(String deviceId, String os) {
        if (deviceId == null || deviceId.isBlank()) {
            throw new RuntimeException("deviceId là bắt buộc.");
        }
        if (os == null || !os.matches("ios|android|web")) {
            throw new RuntimeException("os phải là 'ios', 'android' hoặc 'web'.");
        }

        // Check if device already registered
        Long existingUserId = guestDeviceRepository.findUserIdByDeviceId(deviceId);
        if (existingUserId != null) {
            User existingUser = userRepository.findById(existingUserId).orElse(null);
            if (existingUser != null) {
                String token = jwtUtils.generateToken(existingUser.getId(), "GUEST",
                        Map.of("deviceId", deviceId));
                return new AuthResponse(token, existingUser.getId(), null,
                        existingUser.getDisplayName(), "GUEST");
            }
        }

        // Create new guest user
        User guestUser = new User();
        guestUser.setProvider("guest");
        guestUser.setProviderId(deviceId);
        guestUser.setRole("GUEST");
        guestUser.setDisplayName("Khách #" + deviceId.substring(0, Math.min(6, deviceId.length())));
        guestUser = userRepository.save(guestUser);

        // Register device
        guestDeviceRepository.save(deviceId, os, guestUser.getId());

        String token = jwtUtils.generateToken(guestUser.getId(), "GUEST",
                Map.of("deviceId", deviceId));
        return new AuthResponse(token, guestUser.getId(), null,
                guestUser.getDisplayName(), "GUEST");
    }

    // ──────────────────────────────────────────────
    // Google OAuth2
    // ──────────────────────────────────────────────

    /**
     * Đăng nhập 1-chạm bằng tài khoản Google.
     * Xác minh idToken với Google, tạo hoặc đăng nhập user.
     */
    public AuthResponse loginWithGoogle(String idTokenString, String deviceId) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);

        String googleSub = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        // Find existing Google user or create new one
        User user = userRepository.findByProviderAndProviderId("google", googleSub)
                .orElseGet(() -> {
                    // Check if a local account with same email exists -> link it
                    User existingByEmail = userRepository.findByEmail(email).orElse(null);
                    if (existingByEmail != null) {
                        existingByEmail.setProvider("google");
                        existingByEmail.setProviderId(googleSub);
                        if (existingByEmail.getAvatarUrl() == null) {
                            existingByEmail.setAvatarUrl(pictureUrl);
                        }
                        return userRepository.save(existingByEmail);
                    }

                    // Create new user
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setDisplayName(name);
                    newUser.setAvatarUrl(pictureUrl);
                    newUser.setProvider("google");
                    newUser.setProviderId(googleSub);
                    newUser.setRole("USER");
                    return userRepository.save(newUser);
                });

        // Migrate guest device data to Google user if deviceId is provided
        if (deviceId != null && !deviceId.isBlank()) {
            Long guestUserId = guestDeviceRepository.findUserIdByDeviceId(deviceId);
            if (guestUserId != null && !guestUserId.equals(user.getId())) {
                // Here you would migrate guest data (e.g. listening history, tours) to the new user.
                // After migration, you can re-link the device to the new user:
                // guestDeviceRepository.save(deviceId, "unknown", user.getId()); 
                // For now, we leave the hook ready.
            }
        }

        String token = jwtUtils.generateToken(user.getId(), user.getRole(), null);
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getDisplayName(), user.getRole());
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdToken idToken = this.googleVerifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Google ID Token không hợp lệ hoặc đã hết hạn.");
            }
            return idToken.getPayload();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xác thực Google: " + e.getMessage(), e);
        }
    }

    // ──────────────────────────────────────────────
    // Legacy OTP (kept for backward compatibility)
    // ──────────────────────────────────────────────

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
