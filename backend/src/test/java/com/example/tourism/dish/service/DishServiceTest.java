package com.example.tourism.dish.service;

import com.example.tourism.dish.dto.DishDetailResponse;
import com.example.tourism.dish.dto.PoiMenuResponse;
import com.example.tourism.dish.model.Dish;
import com.example.tourism.dish.model.DishImage;
import com.example.tourism.dish.model.MenuCategory;
import com.example.tourism.dish.repository.DishRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DishServiceTest {

    private DishRepository dishRepository;
    private RedisTemplate<String, Object> redisTemplate;
    private ValueOperations<String, Object> valueOperations;
    private ObjectMapper objectMapper;
    private DishService dishService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        dishRepository = mock(DishRepository.class);
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        objectMapper = new ObjectMapper();
        dishService = new DishService(dishRepository, redisTemplate, objectMapper);
    }

    @Test
    void getMenuByPoiId_returnsGroupedMenu() {
        Long poiId = 1L;
        when(valueOperations.get(anyString())).thenReturn(null);
        when(dishRepository.findPoiNameById(poiId)).thenReturn(Optional.of("Quán Ốc Oanh"));

        MenuCategory cat1 = new MenuCategory(1L, poiId, "Món ăn chơi", 1);
        MenuCategory cat2 = new MenuCategory(2L, poiId, "Món chính", 2);
        MenuCategory cat3 = new MenuCategory(3L, poiId, "Đồ uống", 3);
        when(dishRepository.findCategoriesByPoiId(poiId)).thenReturn(List.of(cat1, cat2, cat3));

        Dish dish1 = new Dish();
        dish1.setId(101L);
        dish1.setPoiId(poiId);
        dish1.setMenuCategoryId(1L);
        dish1.setName("Càng ghẹ rang muối ớt");
        dish1.setSignature(true);
        dish1.setHasSeafood(true);
        dish1.setAllergens("Hải sản (Cua, Ghẹ)");

        Dish dish2 = new Dish();
        dish2.setId(102L);
        dish2.setPoiId(poiId);
        dish2.setMenuCategoryId(2L);
        dish2.setName("Ốc hương sốt trứng muối");
        dish2.setSignature(true);
        dish2.setHasSeafood(true);
        dish2.setHasGluten(true);
        dish2.setAllergens("Hải sản, Gluten");

        Dish dish3 = new Dish();
        dish3.setId(103L);
        dish3.setPoiId(poiId);
        dish3.setMenuCategoryId(2L);
        dish3.setName("Nghêu hấp sả Thái");
        dish3.setSignature(false);
        dish3.setHasSeafood(true);

        when(dishRepository.findDishesByPoiId(poiId)).thenReturn(List.of(dish1, dish2, dish3));

        Optional<PoiMenuResponse> menuOpt = dishService.getMenuByPoiId(poiId);

        assertThat(menuOpt).isPresent();
        PoiMenuResponse menu = menuOpt.get();
        assertThat(menu.poiId()).isEqualTo(poiId);
        assertThat(menu.poiName()).isEqualTo("Quán Ốc Oanh");
        assertThat(menu.totalDishes()).isEqualTo(3);
        assertThat(menu.categories()).hasSize(3);

        // Group 1: Món ăn chơi
        assertThat(menu.categories().get(0).categoryName()).isEqualTo("Món ăn chơi");
        assertThat(menu.categories().get(0).dishes()).hasSize(1);
        assertThat(menu.categories().get(0).dishes().get(0).name()).isEqualTo("Càng ghẹ rang muối ớt");
        assertThat(menu.categories().get(0).dishes().get(0).isSignature()).isTrue();
        assertThat(menu.categories().get(0).dishes().get(0).hasSeafood()).isTrue();

        // Group 2: Món chính
        assertThat(menu.categories().get(1).categoryName()).isEqualTo("Món chính");
        assertThat(menu.categories().get(1).dishes()).hasSize(2);
        assertThat(menu.categories().get(1).dishes().get(1).name()).isEqualTo("Nghêu hấp sả Thái");

        // Group 3: Đồ uống
        assertThat(menu.categories().get(2).categoryName()).isEqualTo("Đồ uống");
        assertThat(menu.categories().get(2).dishes()).isEmpty();
    }

    @Test
    void getMenuByPoiId_returnsEmptyWhenPoiNotFound() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(dishRepository.findPoiNameById(999L)).thenReturn(Optional.empty());

        Optional<PoiMenuResponse> menuOpt = dishService.getMenuByPoiId(999L);
        assertThat(menuOpt).isEmpty();
    }

    @Test
    void getDishDetail_returnsFullDishInformation() {
        Long dishId = 4L;
        when(valueOperations.get(anyString())).thenReturn(null);

        Dish dish = new Dish();
        dish.setId(dishId);
        dish.setPoiId(1L);
        dish.setMenuCategoryId(2L);
        dish.setMenuCategoryName("Món chính");
        dish.setName("Ốc hương sốt trứng muối");
        dish.setDescription("Ốc hương tươi sống xào bơ trứng muối béo ngậy.");
        dish.setPrice(135000);
        dish.setUnit("phần");
        dish.setSignature(true);
        dish.setIngredients("Ốc hương tươi sống, Trứng muối, Bơ lạt Anchor, Tỏi băm, Bánh mì");
        dish.setAllergens("Hải sản, Trứng, Gluten");
        dish.setHasPeanuts(false);
        dish.setHasSeafood(true);
        dish.setHasGluten(true);
        dish.setCreatedAt(LocalDateTime.now());

        when(dishRepository.findDishById(dishId)).thenReturn(Optional.of(dish));
        when(dishRepository.findPoiNameById(1L)).thenReturn(Optional.of("Quán Ốc Oanh"));

        DishImage image1 = new DishImage(1L, dishId, "https://example.com/closeup1.jpg", "Cận cảnh sốt trứng muối", true, 1);
        DishImage image2 = new DishImage(2L, dishId, "https://example.com/closeup2.jpg", "Cận cảnh bánh mì nóng", true, 2);
        when(dishRepository.findImagesByDishId(dishId)).thenReturn(List.of(image1, image2));

        Optional<DishDetailResponse> detailOpt = dishService.getDishDetail(dishId);

        assertThat(detailOpt).isPresent();
        DishDetailResponse detail = detailOpt.get();
        assertThat(detail.id()).isEqualTo(dishId);
        assertThat(detail.name()).isEqualTo("Ốc hương sốt trứng muối");
        assertThat(detail.poiName()).isEqualTo("Quán Ốc Oanh");
        assertThat(detail.menuCategoryName()).isEqualTo("Món chính");
        assertThat(detail.isSignature()).isTrue();

        // Check ingredients
        assertThat(detail.ingredients()).containsExactly(
                "Ốc hương tươi sống", "Trứng muối", "Bơ lạt Anchor", "Tỏi băm", "Bánh mì"
        );

        // Check allergen warnings (peanuts, seafood, gluten)
        assertThat(detail.hasPeanuts()).isFalse();
        assertThat(detail.hasSeafood()).isTrue();
        assertThat(detail.hasGluten()).isTrue();
        assertThat(detail.allergens()).contains("Hải sản", "Trứng", "Gluten");

        // Check close-up photos
        assertThat(detail.images()).hasSize(2);
        assertThat(detail.images().get(0).isCloseUp()).isTrue();
        assertThat(detail.images().get(0).caption()).isEqualTo("Cận cảnh sốt trứng muối");
    }

    @Test
    void getDishDetail_returnsEmptyWhenDishNotFound() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(dishRepository.findDishById(999L)).thenReturn(Optional.empty());

        Optional<DishDetailResponse> detailOpt = dishService.getDishDetail(999L);
        assertThat(detailOpt).isEmpty();
    }
}
