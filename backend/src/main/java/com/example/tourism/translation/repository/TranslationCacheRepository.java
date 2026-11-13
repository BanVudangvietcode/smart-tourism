package com.example.tourism.translation.repository;

import com.example.tourism.translation.model.TranslationCacheEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class TranslationCacheRepository {

    private static final Logger log = LoggerFactory.getLogger(TranslationCacheRepository.class);

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public TranslationCacheRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
    }

    /**
     * Truy vấn hàng loạt các bản dịch theo danh sách hashKey.
     * Trả về Map<hashKey, translatedText>.
     */
    public Map<String, String> findTranslationsByHashKeys(Collection<String> hashKeys) {
        if (hashKeys == null || hashKeys.isEmpty()) {
            return Collections.emptyMap();
        }

        String sql = "SELECT hash_key, translated_text FROM translation_cache WHERE hash_key IN (:keys)";
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("keys", hashKeys);

        Map<String, String> result = new HashMap<>();
        namedParameterJdbcTemplate.query(sql, parameters, rs -> {
            result.put(rs.getString("hash_key").trim(), rs.getString("translated_text"));
        });

        return result;
    }

    /**
     * Lưu hàng loạt các bản dịch vào bảng translation_cache.
     * Bỏ qua nếu đã tồn tại khóa hash_key (ON CONFLICT DO NOTHING).
     */
    public void saveBatch(List<TranslationCacheEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return;
        }

        String sql = "INSERT INTO translation_cache (hash_key, locale, translated_text, created_at) " +
                     "VALUES (?, ?, ?, NOW()) " +
                     "ON CONFLICT (hash_key) DO NOTHING";

        try {
            jdbcTemplate.batchUpdate(sql, entries, entries.size(), (ps, entry) -> {
                ps.setString(1, entry.getHashKey());
                ps.setString(2, entry.getLocale());
                ps.setString(3, entry.getTranslatedText());
            });
            log.debug("Batch saved {} translation cache entries", entries.size());
        } catch (Exception e) {
            log.error("Failed to batch save translation cache: {}", e.getMessage());
        }
    }
}
