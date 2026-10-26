package com.example.tourism.poi.service;

import com.example.tourism.poi.dto.PoiTypeRequest;
import com.example.tourism.poi.dto.PoiTypeResponse;
import com.example.tourism.poi.repository.PoiTypeRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PoiTypeService {

    private final PoiTypeRepository poiTypeRepository;

    public PoiTypeService(PoiTypeRepository poiTypeRepository) {
        this.poiTypeRepository = poiTypeRepository;
    }

    public List<PoiTypeResponse> getAllPoiTypes() {
        return poiTypeRepository.findAll().stream()
                .map(PoiTypeResponse::from)
                .toList();
    }

    public PoiTypeResponse getPoiTypeByCode(String code) {
        return poiTypeRepository.findByCode(code)
                .map(PoiTypeResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phân loại hệ thống mã=" + code));
    }

    public PoiTypeResponse createPoiType(PoiTypeRequest req) {
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Tên phân loại không được để trống");
        }

        String rawCode = (req.code() != null && !req.code().isBlank())
                ? req.code().trim()
                : generateCodeFromName(req.name());

        String normalizedCode = rawCode.toUpperCase().replaceAll("[^A-Z0-9_]+", "_").replaceAll("^_|_$", "");
        if (normalizedCode.isBlank()) {
            normalizedCode = "TYPE_" + System.currentTimeMillis() % 10000;
        }

        // Tự động thêm hậu tố nếu trùng mã để không bao giờ gây lỗi cho người dùng
        String baseCode = normalizedCode;
        int counter = 2;
        while (poiTypeRepository.findByCode(normalizedCode).isPresent()) {
            normalizedCode = baseCode + "_" + counter++;
        }

        int sortOrder = poiTypeRepository.getNextSortOrder();
        poiTypeRepository.create(
                normalizedCode,
                req.name().trim(),
                req.icon() != null ? req.icon() : "📍",
                req.description(),
                sortOrder
        );

        return getPoiTypeByCode(normalizedCode);
    }

    public PoiTypeResponse updatePoiType(String code, PoiTypeRequest req) {
        poiTypeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phân loại hệ thống mã=" + code));

        poiTypeRepository.update(code, req.name(), req.icon(), req.description(), req.sortOrder());
        return getPoiTypeByCode(code);
    }

    public void deletePoiType(String code) {
        if ("FOOD".equalsIgnoreCase(code)) {
            throw new IllegalArgumentException("Không thể xóa phân loại hệ thống mặc định 'FOOD'");
        }

        poiTypeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phân loại hệ thống mã=" + code));

        poiTypeRepository.delete(code);
    }

    private String generateCodeFromName(String name) {
        String nfdNormalizedString = Normalizer.normalize(name, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccents = pattern.matcher(nfdNormalizedString).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
        return noAccents.toUpperCase().replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
    }
}
