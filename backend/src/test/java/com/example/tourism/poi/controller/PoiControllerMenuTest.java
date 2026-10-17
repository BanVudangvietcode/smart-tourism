package com.example.tourism.poi.controller;

import com.example.tourism.dish.dto.DishSummaryResponse;
import com.example.tourism.dish.dto.MenuCategoryGroupResponse;
import com.example.tourism.dish.dto.PoiMenuResponse;
import com.example.tourism.dish.service.DishService;
import com.example.tourism.poi.service.PoiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PoiControllerMenuTest {

    private MockMvc mockMvc;
    private PoiService poiService;
    private DishService dishService;

    @BeforeEach
    void setUp() {
        poiService = mock(PoiService.class);
        dishService = mock(DishService.class);
        PoiController controller = new PoiController(poiService, dishService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getMenu_returnsCategorizedMenu() throws Exception {
        Long poiId = 1L;
        DishSummaryResponse dish = new DishSummaryResponse(
                1L, poiId, 1L, "Càng ghẹ rang muối ớt", "cang-ghe-rang-muoi-ot",
                "Mô tả càng ghẹ", 110000, 125000, "dĩa",
                true, "https://example.com/thumb.jpg",
                List.of("Hải sản"), false, true, false
        );

        MenuCategoryGroupResponse group = new MenuCategoryGroupResponse(
                1L, "Món ăn chơi", 1, List.of(dish)
        );

        PoiMenuResponse menuResponse = new PoiMenuResponse(
                poiId, "Quán Ốc Oanh", 1, List.of(group)
        );

        when(dishService.getMenuByPoiId(poiId)).thenReturn(Optional.of(menuResponse));

        mockMvc.perform(get("/api/v1/pois/{poiId}/menu", poiId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(poiId))
                .andExpect(jsonPath("$.poiName").value("Quán Ốc Oanh"))
                .andExpect(jsonPath("$.totalDishes").value(1))
                .andExpect(jsonPath("$.categories[0].categoryName").value("Món ăn chơi"))
                .andExpect(jsonPath("$.categories[0].dishes[0].name").value("Càng ghẹ rang muối ớt"))
                .andExpect(jsonPath("$.categories[0].dishes[0].isSignature").value(true))
                .andExpect(jsonPath("$.categories[0].dishes[0].hasSeafood").value(true));
    }

    @Test
    void getMenu_returns404WhenPoiNotFound() throws Exception {
        when(dishService.getMenuByPoiId(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/pois/999/menu"))
                .andExpect(status().isNotFound());
    }
}
