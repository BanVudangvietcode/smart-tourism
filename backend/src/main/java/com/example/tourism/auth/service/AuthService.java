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
import java.security.SecureRandom;
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

    private static final long OTP_TTL_MS = 5 * 60 * 1000L; // OTP sống 5 phút
    private static final SecureRandom RANDOM = new SecureRandom();

    private record OtpEntry(String code, long expiresAt) {}

    // Lưu tạm trong RAM (đủ cho demo). Production nên chuyển sang Redis có TTL.
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

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

    public AuthResponse loginAsAdmin() {
        User adminUser = userRepository.findByEmail("admin@saigonwhispers.vn")
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail("admin@saigonwhispers.vn");
                    u.setDisplayName("Quản Trị Viên");
                    u.setRole("ADMIN");
                    u.setProvider("local");
                    return userRepository.save(u);
                });
        userRepository.updateRole(adminUser.getId(), "ADMIN");
        String token = jwtUtils.generateToken(adminUser.getId(), "ADMIN", null);
        return new AuthResponse(token, adminUser.getId(), adminUser.getEmail(),
                adminUser.getDisplayName(), "ADMIN");
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
        String normalizedPhone = phone.trim();
        // Tạo mã OTP 6 số
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));

        // Lưu vào bộ nhớ kèm thời gian hết hạn (ghi đè nếu SĐT yêu cầu lại)
        otpStorage.put(normalizedPhone, new OtpEntry(otp, System.currentTimeMillis() + OTP_TTL_MS));

        // Gửi qua Telegram
        telegramBotService.sendOtpMessage(normalizedPhone, otp);
    }

    /**
     * Xác thực OTP rồi tìm/tạo User ứng với SĐT này, trả JWT đầy đủ (userId + role).
     * Không cần sửa schema: dùng provider = "phone", provider_id = SĐT.
     */
    public AuthResponse verifyOtp(String phone, String otp) {
        String normalizedPhone = phone.trim();
        OtpEntry entry = otpStorage.get(normalizedPhone);

        if (entry == null || System.currentTimeMillis() > entry.expiresAt()
                || !entry.code().equals(otp.trim())) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        // Xác nhận thành công -> xoá OTP (dùng 1 lần)
        otpStorage.remove(normalizedPhone);

        User user = userRepository.findByProviderAndProviderId("phone", normalizedPhone)
                .orElseGet(() -> {
                    User u = new User();
                    u.setProvider("phone");
                    u.setProviderId(normalizedPhone);
                    u.setRole("USER");
                    String tail = normalizedPhone.length() > 4
                            ? normalizedPhone.substring(normalizedPhone.length() - 4)
                            : normalizedPhone;
                    u.setDisplayName("Người dùng " + tail);
                    return userRepository.save(u);
                });

        String token = jwtUtils.generateToken(user.getId(), user.getRole(), null);
        AuthResponse response = new AuthResponse(token, user.getId(), user.getEmail(),
                user.getDisplayName(), user.getRole());
        response.setPhone(normalizedPhone);
        return response;
    }
}
