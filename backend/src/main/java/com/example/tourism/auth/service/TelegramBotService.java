package com.example.tourism.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class TelegramBotService {

    private static final Logger log = LoggerFactory.getLogger(TelegramBotService.class);

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.bot.username:smart_tourism_sts_bot}")
    private String botUsername;

    @Value("${telegram.bot.test-chat-id:}")
    private String testChatId;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private final RestTemplate restTemplate;
    private final RestTemplate pollingRestTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Mapping phone -> chatId in RAM
    private final Map<String, String> phoneToChatIdMap = new ConcurrentHashMap<>();
    private final Map<String, String> chatIdToPhoneMap = new ConcurrentHashMap<>();

    // Callback to get or create OTP from AuthService
    private Function<String, String> otpHandler;

    private volatile boolean isRunning = true;
    private long lastUpdateId = 0;
    private Thread pollingThread;

    public TelegramBotService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(8000);
        requestFactory.setReadTimeout(12000);
        this.restTemplate = new RestTemplate(requestFactory);

        SimpleClientHttpRequestFactory pollingFactory = new SimpleClientHttpRequestFactory();
        pollingFactory.setConnectTimeout(10000);
        pollingFactory.setReadTimeout(20000);
        this.pollingRestTemplate = new RestTemplate(pollingFactory);
    }

    public void setOtpHandler(Function<String, String> handler) {
        this.otpHandler = handler;
    }

    @PostConstruct
    public void init() {
        log.info("Telegram Bot Polling đã tắt theo cấu hình.");
    }

    @PreDestroy
    public void cleanup() {
        isRunning = false;
        if (pollingThread != null) {
            pollingThread.interrupt();
        }
    }

    public static String normalizePhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("84") && digits.length() >= 10) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    public String getDeepLinkUrl(String phone) {
        String cleanPhone = normalizePhone(phone);
        return "https://t.me/" + botUsername + "?start=otp_" + cleanPhone;
    }

    public String getWebTelegramUrl(String phone) {
        String cleanPhone = normalizePhone(phone);
        return "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3D" + botUsername + "%26start%3Dotp_" + cleanPhone;
    }

    public String getChatId(String phone) {
        String cleanPhone = normalizePhone(phone);
        if (cleanPhone.isEmpty()) return null;

        // 1. Kiểm tra RAM
        String chatId = phoneToChatIdMap.get(cleanPhone);
        if (chatId != null && !chatId.isBlank()) {
            return chatId;
        }

        // 2. Kiểm tra Redis (nếu có kết nối)
        if (redisTemplate != null) {
            try {
                Object val = redisTemplate.opsForValue().get("telegram:phone:" + cleanPhone);
                if (val != null) {
                    chatId = String.valueOf(val);
                    phoneToChatIdMap.put(cleanPhone, chatId);
                    return chatId;
                }
            } catch (Exception e) {
                log.debug("Redis lookup failed for phone {}: {}", cleanPhone, e.getMessage());
            }
        }

        return null;
    }

    public void savePhoneChatMapping(String phone, String chatId) {
        String cleanPhone = normalizePhone(phone);
        if (cleanPhone.isEmpty() || chatId == null || chatId.isBlank()) return;

        phoneToChatIdMap.put(cleanPhone, chatId);
        chatIdToPhoneMap.put(chatId, cleanPhone);

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set("telegram:phone:" + cleanPhone, chatId, 30, TimeUnit.DAYS);
                redisTemplate.opsForValue().set("telegram:chat:" + chatId, cleanPhone, 30, TimeUnit.DAYS);
            } catch (Exception e) {
                log.debug("Redis save failed for phone {}: {}", cleanPhone, e.getMessage());
            }
        }
        log.info("Đã liên kết SĐT {} với Telegram Chat ID: {}", cleanPhone, chatId);
    }

    public void sendOtpMessageToChat(String chatId, String phone, String otp) {
        String message = "🔐 *MÃ XÁC THỰC SMART TOURISM*\n\n"
                + "Mã OTP của bạn cho số *" + phone + "* là: `" + otp + "`\n\n"
                + "⏱ Mã có hiệu lực trong *5 phút*.\n"
                + "⚠️ Tuyệt đối không chia sẻ mã này cho bất kỳ ai!";

        sendMessage(chatId, message, "Markdown");
    }

    public void sendOtpMessage(String phone, String otp) {
        String chatId = getChatId(phone);
        if (chatId != null) {
            sendOtpMessageToChat(chatId, phone, otp);
        } else if (testChatId != null && !testChatId.isBlank()) {
            sendOtpMessageToChat(testChatId, phone, otp);
        } else {
            log.warn("Chưa tìm thấy Telegram chatId cho SĐT: {}", phone);
        }
    }

    public void sendMessage(String chatId, String text, String parseMode) {
        if (botToken == null || botToken.isBlank()) return;

        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        Map<String, Object> request = new HashMap<>();
        request.put("chat_id", chatId);
        request.put("text", text);
        if (parseMode != null) {
            request.put("parse_mode", parseMode);
        }

        try {
            restTemplate.postForObject(url, request, String.class);
            log.info("Gửi tin nhắn Telegram thành công tới chatId: {}", chatId);
        } catch (Exception e) {
            log.error("Lỗi khi gửi tin nhắn Telegram tới {}: {}", chatId, e.getMessage());
        }
    }

    private void pollUpdatesLoop() {
        log.info("Telegram Poller đã bắt đầu vòng lặp getUpdates.");
        while (isRunning && !Thread.currentThread().isInterrupted()) {
            try {
                String url = "https://api.telegram.org/bot" + botToken + "/getUpdates?offset=" + lastUpdateId + "&timeout=5";
                String responseBody = pollingRestTemplate.getForObject(url, String.class);
                if (responseBody != null) {
                    processUpdates(responseBody);
                }
            } catch (Exception e) {
                if (!isRunning) break;
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException ie) {
                    break;
                }
            }
        }
        log.info("Telegram Poller đã dừng.");
    }

    private void processUpdates(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            if (!root.path("ok").asBoolean(false)) return;

            JsonNode results = root.path("result");
            if (results.isArray()) {
                for (JsonNode update : results) {
                    long updateId = update.path("update_id").asLong();
                    lastUpdateId = Math.max(lastUpdateId, updateId + 1);

                    JsonNode message = update.path("message");
                    if (message.isMissingNode()) continue;

                    String text = message.path("text").asText("").trim();
                    long chatId = message.path("chat").path("id").asLong();
                    String firstName = message.path("chat").path("first_name").asText("bạn");

                    // 1. Nếu người dùng chia sẻ danh bạ (Share Contact)
                    JsonNode contact = message.path("contact");
                    if (!contact.isMissingNode()) {
                        String contactPhone = contact.path("phone_number").asText("").trim();
                        handlePhoneReceived(String.valueOf(chatId), firstName, contactPhone);
                        continue;
                    }

                    // 2. Nếu là lệnh /start
                    if (text.startsWith("/start")) {
                        handleStartCommand(String.valueOf(chatId), firstName, text);
                    } else if (!text.isBlank()) {
                        // 3. Nếu người dùng gõ thẳng số điện thoại vào chat bot (ví dụ: 0964603676)
                        String clean = normalizePhone(text);
                        if (clean.length() >= 9 && clean.length() <= 11) {
                            handlePhoneReceived(String.valueOf(chatId), firstName, clean);
                        } else {
                            String reply = "Xin chào " + firstName + "! 👋\n\n"
                                    + "Để nhận mã OTP xác thực, bạn chỉ cần gửi tin nhắn là *Số điện thoại* (ví dụ: `0964603676`) vào đây nhé!";
                            sendMessage(String.valueOf(chatId), reply, "Markdown");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi xử lý update Telegram: {}", e.getMessage());
        }
    }

    private void handleStartCommand(String chatId, String firstName, String fullText) {
        // Ví dụ: "/start otp_0964603676" hoặc "/start 0964603676" hoặc "/start"
        String payload = fullText.replace("/start", "").trim();

        if (payload.startsWith("otp_")) {
            payload = payload.substring(4).trim();
        }

        String cleanPhone = normalizePhone(payload);
        if (cleanPhone.length() >= 9 && cleanPhone.length() <= 11) {
            handlePhoneReceived(chatId, firstName, cleanPhone);
        } else {
            String reply = "Xin chào " + firstName + "! 👋\n\n"
                    + "Đây là Bot hỗ trợ nhận mã OTP tự động của *Smart Tourism Guide* (Quận 4 - TP.HCM).\n\n"
                    + "💡 *Cách nhận mã:* Bạn chỉ cần gửi tin nhắn là *Số điện thoại của bạn* (ví dụ: `0964603676`) vào đây để nhận mã OTP ngay lập tức!";
            sendMessage(chatId, reply, "Markdown");
        }
    }

    private void handlePhoneReceived(String chatId, String firstName, String rawPhone) {
        String cleanPhone = normalizePhone(rawPhone);
        if (cleanPhone.length() < 9) return;

        // 1. Lưu liên kết phone -> chatId
        savePhoneChatMapping(cleanPhone, chatId);

        // 2. Lấy hoặc sinh mã OTP
        String otp = null;
        if (otpHandler != null) {
            otp = otpHandler.apply(cleanPhone);
        }

        if (otp != null && !otp.isBlank()) {
            String reply = "🎉 *Chào mừng " + firstName + " đến với Smart Tourism!*\n\n"
                    + "🔐 Mã xác thực OTP cho số *" + cleanPhone + "* của bạn là: `" + otp + "`\n\n"
                    + "⏱ Mã có hiệu lực trong *5 phút*.\n"
                    + "👉 Hãy quay lại trình duyệt web để nhập mã này nhé!";
            sendMessage(chatId, reply, "Markdown");
        } else {
            sendMessage(chatId, "✅ Đã kết nối thành công tài khoản Telegram với số *" + cleanPhone + "*!\n\nVui lòng quay lại web và bấm nhận mã OTP.", "Markdown");
        }
    }
}
