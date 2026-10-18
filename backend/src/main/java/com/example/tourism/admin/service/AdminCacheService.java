package com.example.tourism.admin.service;

import com.example.tourism.admin.dto.EvictCacheResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminCacheService {

    private static final Logger log = LoggerFactory.getLogger(AdminCacheService.class);

    private final RedisTemplate<String, Object> redisTemplate;

    public AdminCacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * POST /api/v1/admin/cache/evict
     * Cưỡng chế xóa cache Redis theo pattern (hoặc toàn bộ "poi:*" nếu để trống).
     */
    public EvictCacheResponse evictCache(String pattern) {
        String targetPattern = (pattern != null && !pattern.isBlank()) ? pattern.trim() : "poi:*";
        Set<String> keys = Collections.emptySet();

        try {
            keys = redisTemplate.keys(targetPattern);
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm keys Redis với mẫu {}: {}", targetPattern, e.getMessage());
        }

        long evictedCount = 0;
        List<String> evictedKeyList = new ArrayList<>();

        if (keys != null && !keys.isEmpty()) {
            evictedKeyList.addAll(keys);
            try {
                Long deleted = redisTemplate.delete(keys);
                evictedCount = (deleted != null) ? deleted : keys.size();
            } catch (Exception e) {
                log.warn("Lỗi khi xóa keys Redis: {}", e.getMessage());
                evictedCount = keys.size();
            }
        }

        String message = "Đã cưỡng chế xóa " + evictedCount + " khóa cache Redis khớp với mẫu '" + targetPattern + "'.";
        return new EvictCacheResponse(targetPattern, evictedCount, evictedKeyList, message);
    }
}

