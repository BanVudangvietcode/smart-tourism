package com.example.tourism.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class TelegramBotService {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.bot.test-chat-id}")
    private String testChatId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpMessage(String phone, String otp) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        
        // Cố định gửi về chatId của bạn (dùng cho việc test)
        // Trong thực tế, bạn sẽ cần một bảng mapping số điện thoại -> telegram chatId của user đó.
        String message = "Mã xác nhận OTP của bạn cho số " + phone + " là: " + otp;

        Map<String, Object> request = new HashMap<>();
        request.put("chat_id", testChatId);
        request.put("text", message);

        try {
            restTemplate.postForObject(url, request, String.class);
            System.out.println("OTP sent to Telegram successfully");
        } catch (Exception e) {
            System.err.println("Failed to send OTP to Telegram: " + e.getMessage());
            // Tuỳ vào logic mà bạn có thể throw exception ở đây
        }
    }
}
