package com.example.tourism.admin.service;

import com.example.tourism.admin.dto.BatchImportResponse;
import com.example.tourism.admin.dto.CreateAdminDishRequest;
import com.example.tourism.admin.dto.OcrMenuDraftResponse;
import com.example.tourism.admin.repository.AdminMenuRepository;
import com.example.tourism.ai.service.GeminiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMenuService Unit Tests")
class AdminMenuServiceTest {

    @Mock
    private AdminMenuRepository adminMenuRepository;

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    private ObjectMapper objectMapper;
    private AdminMenuService adminMenuService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        adminMenuService = new AdminMenuService(adminMenuRepository, geminiClient, objectMapper, redisTemplate);
    }

    @Test
    @DisplayName("scanMenuOcr: should parse Gemini OCR response when valid JSON is returned")
    void scanMenuOcr_geminiSuccess() {
        when(adminMenuRepository.findPoiNameById(1L)).thenReturn(Optional.of("Quán Ốc Oanh"));

        String mockGeminiJson = """
                {
                  "detectedDishes": [
                    {
                      "name": "Ốc móng tay xào rau muống",
                      "categoryName": "Ốc xào",
                      "price": 75000,
                      "isSignature": false,
                      "description": "Ốc móng tay xào tỏi và rau muống giòn",
                      "allergens": "Hải sản"
                    }
                  ]
                }
                """;

        when(geminiClient.generateWithImage(anyString(), anyString(), any(), anyString(), eq(true)))
                .thenReturn(Optional.of(mockGeminiJson));

        MockMultipartFile image = new MockMultipartFile("file", "menu.jpg", "image/jpeg", "image-bytes".getBytes());
        OcrMenuDraftResponse response = adminMenuService.scanMenuOcr(1L, image);

        assertNotNull(response);
        assertEquals(1L, response.poiId());
        assertEquals(1, response.count());
        assertEquals("Ốc móng tay xào rau muống", response.detectedDishes().get(0).name());
        assertEquals(75000, response.detectedDishes().get(0).price());
    }

    @Test
    @DisplayName("scanMenuOcr: should use smart fallback when Gemini is offline")
    void scanMenuOcr_geminiFallback() {
        when(adminMenuRepository.findPoiNameById(1L)).thenReturn(Optional.of("Quán Ốc Oanh"));
        when(geminiClient.generateWithImage(anyString(), anyString(), any(), anyString(), eq(true)))
                .thenReturn(Optional.empty());

        MockMultipartFile image = new MockMultipartFile("file", "menu.jpg", "image/jpeg", "image-bytes".getBytes());
        OcrMenuDraftResponse response = adminMenuService.scanMenuOcr(1L, image);

        assertNotNull(response);
        assertTrue(response.count() > 0);
        assertTrue(response.detectedDishes().stream().anyMatch(d -> d.name().contains("Ốc")));
        assertTrue(response.note().contains("Fallback"));
    }

    @Test
    @DisplayName("batchImportMenu: should parse CSV and insert dishes")
    void batchImportMenu_csvSuccess() {
        when(adminMenuRepository.findPoiNameById(1L)).thenReturn(Optional.of("Quán Ốc Oanh"));
        when(adminMenuRepository.findOrCreateMenuCategory(eq(1L), anyString())).thenReturn(10L);
        when(adminMenuRepository.insertDish(eq(1L), eq(10L), any(), anyString(), anyBoolean(), anyBoolean(), anyBoolean()))
                .thenReturn(101L, 102L);

        String csvData = """
                name,category,price,is_signature,description,allergens
                Nghêu hấp xả,Món hấp,60000,false,Nghêu tươi hấp sả,Hải sản
                Càng ghẹ sốt cay,Món rang,120000,true,Càng ghẹ sốt cay Tây Ninh,Hải sản
                """;
        MockMultipartFile file = new MockMultipartFile("file", "menu.csv", "text/csv", csvData.getBytes());

        BatchImportResponse response = adminMenuService.batchImportMenu(1L, file);

        assertNotNull(response);
        assertEquals(2, response.importedCount());
        assertEquals(2, response.importedDishNames().size());
        assertEquals("Nghêu hấp xả", response.importedDishNames().get(0));
        assertEquals("Càng ghẹ sốt cay", response.importedDishNames().get(1));
    }

    @Test
    @DisplayName("deduceAllergens: should accurately detect seafood, peanuts, and gluten")
    void deduceAllergens_tests() {
        AdminMenuService.AllergenInfo a1 = AdminMenuService.deduceAllergens("Có hải sản", "Ốc hương nướng");
        assertTrue(a1.hasSeafood());
        assertFalse(a1.hasPeanuts());
        assertFalse(a1.hasGluten());

        AdminMenuService.AllergenInfo a2 = AdminMenuService.deduceAllergens("Đậu phộng rang", "Sò điệp mỡ hành");
        assertTrue(a2.hasSeafood());
        assertTrue(a2.hasPeanuts());

        AdminMenuService.AllergenInfo a3 = AdminMenuService.deduceAllergens("Ăn kèm bánh mì giòn", "Phá lấu bò");
        assertTrue(a3.hasGluten());
    }
}

