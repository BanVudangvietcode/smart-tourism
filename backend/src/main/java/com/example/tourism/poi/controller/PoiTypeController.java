package com.example.tourism.poi.controller;

import com.example.tourism.poi.dto.PoiTypeRequest;
import com.example.tourism.poi.dto.PoiTypeResponse;
import com.example.tourism.poi.service.PoiTypeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/poi-types")
@CrossOrigin(origins = "http://localhost:3000")
public class PoiTypeController {

    private final PoiTypeService poiTypeService;

    public PoiTypeController(PoiTypeService poiTypeService) {
        this.poiTypeService = poiTypeService;
    }

    /**
     * GET /api/v1/poi-types
     * Lấy danh sách tất cả các phân loại hệ thống (POI Types).
     */
    @GetMapping
    public ResponseEntity<List<PoiTypeResponse>> getAll() {
        return ResponseEntity.ok(poiTypeService.getAllPoiTypes());
    }

    /**
     * GET /api/v1/poi-types/{code}
     */
    @GetMapping("/{code}")
    public ResponseEntity<PoiTypeResponse> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(poiTypeService.getPoiTypeByCode(code));
    }

    /**
     * POST /api/v1/poi-types
     * Thêm phân loại hệ thống mới
     */
    @PostMapping
    public ResponseEntity<PoiTypeResponse> create(@RequestBody PoiTypeRequest req) {
        PoiTypeResponse created = poiTypeService.createPoiType(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/poi-types/{code}
     * Cập nhật phân loại hệ thống
     */
    @PutMapping("/{code}")
    public ResponseEntity<PoiTypeResponse> update(@PathVariable String code, @RequestBody PoiTypeRequest req) {
        PoiTypeResponse updated = poiTypeService.updatePoiType(code, req);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/v1/poi-types/{code}
     * Xóa phân loại hệ thống
     */
    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        poiTypeService.deletePoiType(code);
        return ResponseEntity.noContent().build();
    }
}
