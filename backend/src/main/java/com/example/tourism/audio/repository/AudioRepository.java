package com.example.tourism.audio.repository;

import com.example.tourism.audio.model.PoiAudio;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AudioRepository {

    private final JdbcTemplate jdbcTemplate;

    public AudioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<PoiAudio> audioRowMapper = (rs, rowNum) -> {
        PoiAudio a = new PoiAudio();
        a.setId(rs.getLong("id"));
        a.setPoiId(rs.getLong("poi_id"));
        a.setPoiName(rs.getString("poi_name"));
        a.setTitle(rs.getString("title"));
        a.setFileName(rs.getString("file_name"));
        a.setDurationSeconds(rs.getInt("duration_seconds"));
        a.setFileSizeBytes(rs.getLong("file_size_bytes"));
        a.setVoice(rs.getString("voice"));
        a.setLanguage(rs.getString("language"));
        a.setZone(rs.getString("zone"));
        a.setTranscript(rs.getString("transcript"));
        a.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        a.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return a;
    };

    public Optional<PoiAudio> findAudioByPoiId(Long poiId) {
        String sql = """
                SELECT a.id, a.poi_id, p.name AS poi_name, a.title, a.file_name,
                       a.duration_seconds, a.file_size_bytes, a.voice, a.language,
                       a.zone, a.transcript, a.created_at, a.updated_at
                FROM poi_audios a
                JOIN pois p ON a.poi_id = p.id
                WHERE a.poi_id = ?
                """;
        List<PoiAudio> results = jdbcTemplate.query(sql, audioRowMapper, poiId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<PoiAudio> findAudiosByZone(String zone) {
        String sql = """
                SELECT a.id, a.poi_id, p.name AS poi_name, a.title, a.file_name,
                       a.duration_seconds, a.file_size_bytes, a.voice, a.language,
                       a.zone, a.transcript, a.created_at, a.updated_at
                FROM poi_audios a
                JOIN pois p ON a.poi_id = p.id
                WHERE LOWER(a.zone) = LOWER(?)
                ORDER BY a.id ASC
                """;
        return jdbcTemplate.query(sql, audioRowMapper, zone.trim());
    }

    public Optional<String> findPoiNameById(Long poiId) {
        String sql = "SELECT name FROM pois WHERE id = ?";
        try {
            String name = jdbcTemplate.queryForObject(sql, String.class, poiId);
            return Optional.ofNullable(name);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Thêm mới hoặc cập nhật bản ghi audio cho một POI (UPSERT dựa trên poi_id UNIQUE).
     */
    public Long upsertAudio(PoiAudio audio) {
        String sql = """
                INSERT INTO poi_audios (poi_id, title, file_name, duration_seconds, file_size_bytes, voice, language, zone, transcript, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, now())
                ON CONFLICT (poi_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    file_name = EXCLUDED.file_name,
                    duration_seconds = EXCLUDED.duration_seconds,
                    file_size_bytes = EXCLUDED.file_size_bytes,
                    voice = EXCLUDED.voice,
                    language = EXCLUDED.language,
                    zone = EXCLUDED.zone,
                    transcript = EXCLUDED.transcript,
                    updated_at = now()
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(sql, Long.class,
                audio.getPoiId(),
                audio.getTitle(),
                audio.getFileName(),
                audio.getDurationSeconds(),
                audio.getFileSizeBytes(),
                audio.getVoice() != null ? audio.getVoice() : "Nữ miền Nam (Truyền cảm)",
                audio.getLanguage() != null ? audio.getLanguage() : "vi",
                audio.getZone() != null ? audio.getZone() : "quan4",
                audio.getTranscript()
        );
    }
}

