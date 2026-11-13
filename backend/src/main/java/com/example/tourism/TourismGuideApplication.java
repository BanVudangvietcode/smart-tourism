package com.example.tourism;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

@SpringBootApplication
public class TourismGuideApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(TourismGuideApplication.class, args);
    }

    /**
     * Tự động nạp các biến môi trường từ file .env ở thư mục gốc hoặc thư mục hiện tại
     * vào System Properties để Spring Boot tự động nhận diện (${AI_API_KEY}, ${DB_...}, v.v.)
     */
    private static void loadDotEnvIfPresent() {
        File[] candidatePaths = new File[] {
                new File(".env"),
                new File("../.env"),
                new File("/workspaces/smart-tourism/.env")
        };

        for (File file : candidatePaths) {
            if (file.exists() && file.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            // Loại bỏ dấu nháy kép hoặc đơn nếu có
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                if (val.length() >= 2) val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
                break;
            }
        }
    }
}

