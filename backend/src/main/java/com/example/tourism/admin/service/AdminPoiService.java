package com.example.tourism.admin.service;

import com.example.tourism.admin.dto.AdminPoiResponse;
import com.example.tourism.admin.dto.CreateAdminPoiRequest;
import com.example.tourism.admin.dto.UpdateAdminPoiRequest;
import com.example.tourism.admin.repository.AdminPoiRepository;
import com.example.tourism.audio.dto.AudioCreateResponse;
import com.example.tourism.audio.service.AudioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class AdminPoiService {

    private static final Logger log = LoggerFactory.getLogger(AdminPoiService.class);

    private final AdminPoiRepository adminPoiRepository;
    private final AudioService audioService;
    private final RedisTemplate<String, Object> redisTemplate;

    public AdminPoiService(AdminPoiRepository adminPoiRepository,
                           AudioService audioService,
                           RedisTemplate<String, Object> redisTemplate) {
        this.adminPoiRepository = adminPoiRepository;
        this.audioService = audioService;
        this.redisTemplate = redisTemplate;
    }

    public AdminPoiResponse createPoi(CreateAdminPoiRequest req,
                                      MultipartFile image,
                                      MultipartFile audio,
                                      String audioScript,
                                      String audioTitle) {
        if (req.name() == null || req.name().trim().isBlank()) {
            throw new IllegalArgumentException("Tên địa điểm không được để trống.");
        }
        if (req.latitude() == null || req.latitude() < -90.0 || req.latitude() > 90.0) {
            throw new IllegalArgumentException("Vĩ độ (latitude) không hợp lệ (từ -90 đến 90).");
        }
        if (req.longitude() == null || req.longitude() < -180.0 || req.longitude() > 180.0) {
            throw new IllegalArgumentException("Kinh độ (longitude) không hợp lệ (từ -180 đến 180).");
        }

        String slug = (req.slug() != null && !req.slug().isBlank())
                ? AdminPoiRepository.toSlug(req.slug())
                : AdminPoiRepository.toSlug(req.name());

        String effectiveThumbnail = req.thumbnailUrl();

        // 1. Lưu ảnh đại diện nếu có
        if (image != null && !image.isEmpty()) {
            try {
                String imgFileName = "poi_" + slug + "_" + System.currentTimeMillis() + ".jpg";
                saveImageBytes(imgFileName, image.getBytes());
                effectiveThumbnail = "/images/pois/" + imgFileName;
            } catch (Exception e) {
                log.warn("Lỗi khi lưu ảnh POI: {}", e.getMessage());
            }
        }

        // 2. Chèn vào database
        Long poiId = adminPoiRepository.insertPoi(req, slug, effectiveThumbnail);
        if (poiId == null) {
            throw new RuntimeException("Không thể tạo địa điểm POI mới.");
        }

        // 3. Nếu có ảnh, lưu thêm vào bảng poi_images
        if (effectiveThumbnail != null && !effectiveThumbnail.isBlank()) {
            adminPoiRepository.insertPoiImage(poiId, effectiveThumbnail, req.name(), 1);
        }

        // 4. Nếu có file audio thuyết minh, gọi audioService xử lý
        if (audio != null && !audio.isEmpty()) {
            try {
                String script = (audioScript != null && !audioScript.isBlank())
                        ? audioScript
                        : "Thuyết minh về " + req.name() + ", " + (req.address() != null ? req.address() : "Quận 4");
                String title = (audioTitle != null && !audioTitle.isBlank())
                        ? audioTitle
                        : "Thuyết minh " + req.name();

                audioService.uploadCustomAudio(poiId, title, script, "Nữ miền Nam (Truyền cảm)", "quan4", audio);
                adminPoiRepository.updatePoiAudioUrl(poiId, "/api/v1/audio/stream/" + poiId);
            } catch (Exception e) {
                log.warn("Không thể tải lên audio tự động khi tạo POI {}: {}", poiId, e.getMessage());
            }
        }

        // 5. Xóa cache Redis
        evictPoiCache(poiId);

        return adminPoiRepository.findById(poiId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy POI vừa tạo"));
    }

    public AdminPoiResponse updatePoi(Long id, UpdateAdminPoiRequest req) {
        if (!adminPoiRepository.existsById(id)) {
            throw new NoSuchElementException("Không tìm thấy địa điểm POI với ID: " + id);
        }

        adminPoiRepository.updatePoi(id, req);
        evictPoiCache(id);

        return adminPoiRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy POI sau khi cập nhật: " + id));
    }

    public void softDeletePoi(Long id) {
        if (!adminPoiRepository.existsById(id)) {
            throw new NoSuchElementException("Không tìm thấy địa điểm POI với ID: " + id);
        }

        adminPoiRepository.softDeletePoi(id);
        evictPoiCache(id);
    }

    public AudioCreateResponse uploadPoiAudio(Long id, MultipartFile file, String title, String transcript, String voice) {
        if (!adminPoiRepository.existsById(id)) {
            throw new NoSuchElementException("Không tìm thấy địa điểm POI với ID: " + id);
        }

        String safeTranscript = (transcript != null && !transcript.isBlank())
                ? transcript
                : "Thuyết minh tự động cho địa điểm ID: " + id;

        try {
            AudioCreateResponse response = audioService.uploadCustomAudio(id, title, safeTranscript, voice, "quan4", file);
            adminPoiRepository.updatePoiAudioUrl(id, "/api/v1/audio/stream/" + id);
            evictPoiCache(id);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tải lên file âm thanh: " + e.getMessage(), e);
        }
    }

    private void evictPoiCache(Long poiId) {
        try {
            Set<String> keys = redisTemplate.keys("poi:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Không thể xóa cache Redis cho POI {}: {}", poiId, e.getMessage());
        }
    }

    private void saveImageBytes(String fileName, byte[] bytes) {
        List<Path> targets = List.of(
                Paths.get("backend/src/main/resources/images/pois/" + fileName),
                Paths.get("backend/target/classes/images/pois/" + fileName),
                Paths.get("src/main/resources/images/pois/" + fileName),
                Paths.get("target/classes/images/pois/" + fileName)
        );

        for (Path path : targets) {
            try {
                Path parent = path.getParent();
                if (parent != null) {
                    Files.createDirectories(parent);
                }
                Files.write(path, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            } catch (Exception ignored) {}
        }
    }
}
