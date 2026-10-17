package com.example.tourism.dish.controller;

import com.example.tourism.dish.dto.DishDetailResponse;
import com.example.tourism.dish.dto.DishImageResponse;
import com.example.tourism.dish.service.DishService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DishControllerTest {

    private MockMvc mockMvc;
    private DishService dishService;

    @BeforeEach
    void setUp() {
        dishService = mock(DishService.class);
        DishController controller = new DishController(dishService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getById_returnsDishDetail() throws Exception {
        Long dishId = 4L;
        DishImageResponse image = new DishImageResponse(1L, "https://example.com/closeup.jpg", "Cận cảnh ốc hương sốt trứng muối", true, 1);
        DishDetailResponse response = new DishDetailResponse(
                dishId, 1L, "Quán Ốc Oanh", 2L, "Món chính",
                "Ốc hương sốt trứng muối", "oc-huong-sot-trung-muoi",
                "Mô tả ốc hương sốt trứng muối", 135000, 150000, "phần",
                true, "https://example.com/thumb.jpg",
                List.of("Ốc hương", "Trứng muối", "Bơ lạt"),
                List.of("Hải sản", "Trứng", "Gluten"),
                false, true, true,
                List.of(image),
                LocalDateTime.now()
        );

        when(dishService.getDishDetail(dishId)).thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/v1/dishes/{dishId}", dishId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dishId))
                .andExpect(jsonPath("$.name").value("Ốc hương sốt trứng muối"))
                .andExpect(jsonPath("$.isSignature").value(true))
                .andExpect(jsonPath("$.hasPeanuts").value(false))
                .andExpect(jsonPath("$.hasSeafood").value(true))
                .andExpect(jsonPath("$.hasGluten").value(true))
                .andExpect(jsonPath("$.ingredients[0]").value("Ốc hương"))
                .andExpect(jsonPath("$.allergens[0]").value("Hải sản"))
                .andExpect(jsonPath("$.images[0].isCloseUp").value(true))
                .andExpect(jsonPath("$.images[0].caption").value("Cận cảnh ốc hương sốt trứng muối"));
    }

    @Test
    void getById_returns404WhenNotFound() throws Exception {
        when(dishService.getDishDetail(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/dishes/999"))
                .andExpect(status().isNotFound());
    }
}
