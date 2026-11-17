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

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

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
    private static final long OTP_RESEND_COOLDOWN_MS = 60 * 1000L; // Giới hạn gửi lại sau 60s
    private static final SecureRandom RANDOM = new SecureRandom();

    private record OtpEntry(String code, long expiresAt, long createdAt) {}

    // Lưu tạm trong RAM (đủ cho demo). Production nên chuyển sang Redis có TTL.
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    public AuthService(TelegramBotService telegramBotService, JwtUtils jwtUtils,
                       UserRepository userRepository, GuestDeviceRepository guestDeviceRepository) {
        this.telegramBotService = telegramBotService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.guestDeviceRepository = guestDeviceRepository;
    }

    public record OtpRequestResult(String status, String message, String telegramBotUrl, String telegramWebUrl) {}

    @PostConstruct
    public void init() {
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        // Kết nối callback xử lý khi người dùng ấn /start trên Telegram Bot
        this.telegramBotService.setOtpHandler(this::getOrCreateOtpForTelegram);
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

        if (user.isLocked()) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ.");
        }

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

    public static String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);
            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 128);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi băm mật khẩu", e);
        }
    }

    public static boolean verifyPassword(String rawPassword, String stored) {
        if (stored == null || !stored.contains(":")) return false;
        try {
            String[] parts = stored.split(":");
            byte[] salt = HexFormat.of().parseHex(parts[0]);
            byte[] expectedHash = HexFormat.of().parseHex(parts[1]);

            KeySpec spec = new PBEKeySpec(rawPassword.toCharArray(), salt, 65536, 128);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] testHash = factory.generateSecret(spec).getEncoded();

            return MessageDigest.isEqual(testHash, expectedHash);
        } catch (Exception e) {
            return false;
        }
    }

    public AuthResponse loginAsAdmin(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
        }

        String inputUser = username.trim();
        String inputPass = password.trim();

        User adminUser = userRepository.findByEmail("admin@saigonwhispers.vn")
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail("admin@saigonwhispers.vn");
                    u.setDisplayName("Quản Trị Viên");
                    u.setRole("ADMIN");
                    u.setProvider("local");
                    u.setProviderId("admin");
                    u.setPasswordHash(hashPassword("admin123"));
                    return userRepository.save(u);
                });

        if (adminUser.getPasswordHash() == null || adminUser.getPasswordHash().isBlank()) {
            String defaultHash = hashPassword("admin123");
            adminUser.setPasswordHash(defaultHash);
            userRepository.updatePasswordHash(adminUser.getId(), defaultHash);
        }

        boolean validUser = inputUser.equalsIgnoreCase("admin")
                || inputUser.equalsIgnoreCase(adminUser.getEmail())
                || "admin".equalsIgnoreCase(adminUser.getProviderId());

        if (!validUser || !verifyPassword(inputPass, adminUser.getPasswordHash())) {
            throw new IllegalArgumentException("Tài khoản hoặc mật khẩu Quản trị viên không chính xác.");
        }

        if (adminUser.isLocked()) {
            throw new IllegalArgumentException("Tài khoản Quản trị viên này đã bị khóa.");
        }

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
    // Telegram OTP Authentication Flow
    // ──────────────────────────────────────────────

    public String getOrCreateOtpForTelegram(String phone) {
        String normalizedPhone = TelegramBotService.normalizePhone(phone);
        long now = System.currentTimeMillis();
        OtpEntry existing = otpStorage.get(normalizedPhone);
        if (existing != null && now < existing.expiresAt()) {
            return existing.code();
        }
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpStorage.put(normalizedPhone, new OtpEntry(otp, now + OTP_TTL_MS, now));
        return otp;
    }

    public OtpRequestResult requestOtp(String phone) {
        String normalizedPhone = TelegramBotService.normalizePhone(phone);
        if (normalizedPhone.length() < 9) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ (cần ít nhất 9 chữ số).");
        }

        long now = System.currentTimeMillis();
        OtpEntry existing = otpStorage.get(normalizedPhone);
        if (existing != null) {
            long elapsed = now - existing.createdAt();
            if (elapsed < OTP_RESEND_COOLDOWN_MS) {
                long remaining = (OTP_RESEND_COOLDOWN_MS - elapsed + 999) / 1000;
                throw new IllegalArgumentException("Vui lòng đợi " + remaining + " giây trước khi yêu cầu gửi lại mã OTP.");
            }
        }

        // Tạo mã OTP 6 số
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpStorage.put(normalizedPhone, new OtpEntry(otp, now + OTP_TTL_MS, now));

        String chatId = telegramBotService.getChatId(normalizedPhone);
        if (chatId != null && !chatId.isBlank()) {
            // Đã biết chatId của người dùng -> Gửi thẳng
            telegramBotService.sendOtpMessageToChat(chatId, normalizedPhone, otp);
            return new OtpRequestResult("SENT", "Mã OTP đã được gửi về Telegram của bạn.", null, null);
        } else {
            // Chưa biết chatId -> Trả về deep link Telegram (cả App và Web)
            String botUrl = telegramBotService.getDeepLinkUrl(normalizedPhone);
            String webUrl = telegramBotService.getWebTelegramUrl(normalizedPhone);
            return new OtpRequestResult("WAITING_TELEGRAM", "Vui lòng mở Telegram để nhận mã OTP.", botUrl, webUrl);
        }
    }

    public void generateAndSendOtp(String phone) {
        requestOtp(phone);
    }

    /**
     * Xác thực OTP rồi tìm/tạo User ứng với SĐT này, trả JWT đầy đủ (userId + role).
     * Dùng provider = "phone", provider_id = SĐT.
     */
    public AuthResponse verifyOtp(String phone, String otp) {
        String normalizedPhone = TelegramBotService.normalizePhone(phone);
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

        if (user.isLocked()) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ.");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getRole(), null);
        AuthResponse response = new AuthResponse(token, user.getId(), user.getEmail(),
                user.getDisplayName(), user.getRole());
        response.setPhone(normalizedPhone);
        return response;
    }
}
