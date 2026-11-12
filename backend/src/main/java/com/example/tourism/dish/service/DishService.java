package com.example.tourism.dish.service;

import com.example.tourism.common.util.I18nUtils;
import com.example.tourism.dish.dto.*;
import com.example.tourism.dish.model.Dish;
import com.example.tourism.dish.model.DishImage;
import com.example.tourism.dish.model.MenuCategory;
import com.example.tourism.dish.repository.DishRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class DishService {

    private static final Logger log = LoggerFactory.getLogger(DishService.class);

    private static final String MENU_CACHE_PREFIX = "poi:menu:";
    private static final Duration MENU_CACHE_TTL = Duration.ofMinutes(15);

    private static final String DISH_CACHE_PREFIX = "dish:detail:";
    private static final Duration DISH_CACHE_TTL = Duration.ofMinutes(30);

    private final DishRepository dishRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public DishService(DishRepository dishRepository,
                       RedisTemplate<String, Object> redisTemplate,
                       ObjectMapper objectMapper) {
        this.dishRepository = dishRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get menu for a POI grouped by categories (e.g. Món ăn chơi, Món chính, Đồ uống),
     * with Best-seller (is_signature) flag.
     * Cached in Redis with 15-minute TTL.
     */
    public Optional<PoiMenuResponse> getMenuByPoiId(Long poiId, String lang) {
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang.toLowerCase() : "vi";
        String cacheKey = MENU_CACHE_PREFIX + poiId + ":" + effectiveLang;

        // 1. Try Redis cache first
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache HIT for POI menu {} [lang={}]", poiId, effectiveLang);
                String json = objectMapper.writeValueAsString(cached);
                return Optional.of(objectMapper.readValue(json, PoiMenuResponse.class));
            }
        } catch (Exception e) {
            log.warn("Redis read failed for POI menu {}, falling back to DB", poiId, e);
        }

        // 2. Fetch POI name & existence check
        Optional<String> poiNameOpt = dishRepository.findPoiNameById(poiId, effectiveLang);
        if (poiNameOpt.isEmpty()) {
            return Optional.empty();
        }
        String poiName = poiNameOpt.get();

        // 3. Fetch categories & dishes from DB
        List<MenuCategory> categories = dishRepository.findCategoriesByPoiId(poiId);
        List<Dish> dishes = dishRepository.findDishesByPoiId(poiId);

        // Map dishes by category ID
        Map<Long, List<DishSummaryResponse>> dishesByCategory = new LinkedHashMap<>();
        List<DishSummaryResponse> uncategorizedDishes = new ArrayList<>();

        for (Dish dish : dishes) {
            DishSummaryResponse summary = toSummary(dish, effectiveLang);
            if (dish.getMenuCategoryId() != null) {
                dishesByCategory.computeIfAbsent(dish.getMenuCategoryId(), k -> new ArrayList<>()).add(summary);
            } else {
                uncategorizedDishes.add(summary);
            }
        }

        List<MenuCategoryGroupResponse> categoryGroups = new ArrayList<>();
        Set<Long> processedCategoryIds = new HashSet<>();

        // Group according to defined categories
        for (MenuCategory cat : categories) {
            List<DishSummaryResponse> catDishes = dishesByCategory.getOrDefault(cat.getId(), List.of());
            String catName = I18nUtils.resolve(cat.getName(), cat.getNameEn(), effectiveLang);
            categoryGroups.add(new MenuCategoryGroupResponse(
                    cat.getId(),
                    catName,
                    cat.getSortOrder(),
                    catDishes
            ));
            processedCategoryIds.add(cat.getId());
        }

        // Include any category that has dishes but wasn't in categories table
        for (Map.Entry<Long, List<DishSummaryResponse>> entry : dishesByCategory.entrySet()) {
            if (!processedCategoryIds.contains(entry.getKey())) {
                String fallbackOther = "en".equals(effectiveLang) ? "Other Items" : "Mục khác";
                String catName = entry.getValue().isEmpty() ? fallbackOther :
                        dishes.stream()
                                .filter(d -> Objects.equals(d.getMenuCategoryId(), entry.getKey()))
                                .map(d -> I18nUtils.resolve(d.getMenuCategoryName(), null, effectiveLang))
                                .filter(Objects::nonNull)
                                .findFirst()
                                .orElse(fallbackOther);
                categoryGroups.add(new MenuCategoryGroupResponse(
                        entry.getKey(),
                        catName,
                        999,
                        entry.getValue()
                ));
            }
        }

        // Include uncategorized dishes if any
        if (!uncategorizedDishes.isEmpty()) {
            String uncategorizedName = "en".equals(effectiveLang) ? "Other Dishes" : "Món khác";
            categoryGroups.add(new MenuCategoryGroupResponse(
                    null,
                    uncategorizedName,
                    1000,
                    uncategorizedDishes
            ));
        }

        PoiMenuResponse response = new PoiMenuResponse(
                poiId,
                poiName,
                dishes.size(),
                categoryGroups
        );

        // 4. Cache in Redis
        try {
            redisTemplate.opsForValue().set(cacheKey, response, MENU_CACHE_TTL);
            log.debug("Cached POI menu {} in Redis [lang={}]", poiId, effectiveLang);
        } catch (Exception e) {
            log.warn("Failed to cache POI menu {} in Redis", poiId, e);
        }

        return Optional.of(response);
    }

    public Optional<PoiMenuResponse> getMenuByPoiId(Long poiId) {
        return getMenuByPoiId(poiId, "vi");
    }

    /**
     * Get detailed dish information: description, close-up images,
     * primary ingredients, and allergen warnings (peanuts, seafood, gluten).
     * Cached in Redis with 30-minute TTL.
     */
    public Optional<DishDetailResponse> getDishDetail(Long dishId, String lang) {
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang.toLowerCase() : "vi";
        String cacheKey = DISH_CACHE_PREFIX + dishId + ":" + effectiveLang;

        // 1. Try Redis cache first
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache HIT for Dish detail {} [lang={}]", dishId, effectiveLang);
                String json = objectMapper.writeValueAsString(cached);
                return Optional.of(objectMapper.readValue(json, DishDetailResponse.class));
            }
        } catch (Exception e) {
            log.warn("Redis read failed for Dish detail {}, falling back to DB", dishId, e);
        }

        // 2. Fetch from DB
        Optional<Dish> dishOpt = dishRepository.findDishById(dishId);
        if (dishOpt.isEmpty()) {
            return Optional.empty();
        }

        Dish dish = dishOpt.get();
        String poiName = dishRepository.findPoiNameById(dish.getPoiId(), effectiveLang).orElse(null);
        List<DishImage> images = dishRepository.findImagesByDishId(dishId);

        DishDetailResponse detail = toDetail(dish, poiName, images, effectiveLang);

        // 3. Cache in Redis
        try {
            redisTemplate.opsForValue().set(cacheKey, detail, DISH_CACHE_TTL);
            log.debug("Cached Dish detail {} in Redis [lang={}]", dishId, effectiveLang);
        } catch (Exception e) {
            log.warn("Failed to cache Dish detail {} in Redis", dishId, e);
        }

        return Optional.of(detail);
    }

    public Optional<DishDetailResponse> getDishDetail(Long dishId) {
        return getDishDetail(dishId, "vi");
    }

    private DishSummaryResponse toSummary(Dish d, String lang) {
        String name = I18nUtils.resolve(d.getName(), d.getNameEn(), lang);
        String description = I18nUtils.resolve(d.getDescription(), d.getDescriptionEn(), lang);
        String unit = I18nUtils.resolve(d.getUnit(), d.getUnitEn(), lang);

        return new DishSummaryResponse(
                d.getId(),
                d.getPoiId(),
                d.getMenuCategoryId(),
                name,
                d.getSlug(),
                description,
                d.getPrice(),
                d.getOriginalPrice(),
                unit,
                d.isSignature(),
                d.getThumbnailUrl(),
                parseList(d.getAllergens()),
                d.isHasPeanuts(),
                d.isHasSeafood(),
                d.isHasGluten()
        );
    }

    private DishDetailResponse toDetail(Dish d, String poiName, List<DishImage> images, String lang) {
        String name = I18nUtils.resolve(d.getName(), d.getNameEn(), lang);
        String description = I18nUtils.resolve(d.getDescription(), d.getDescriptionEn(), lang);
        String unit = I18nUtils.resolve(d.getUnit(), d.getUnitEn(), lang);
        String ingredientsRaw = I18nUtils.resolve(d.getIngredients(), d.getIngredientsEn(), lang);

        List<DishImageResponse> imageResponses = images.stream()
                .map(img -> new DishImageResponse(
                        img.getId(),
                        img.getUrl(),
                        img.getCaption(),
                        img.isCloseUp(),
                        img.getSortOrder()
                ))
                .toList();

        return new DishDetailResponse(
                d.getId(),
                d.getPoiId(),
                poiName,
                d.getMenuCategoryId(),
                d.getMenuCategoryName(),
                name,
                d.getSlug(),
                description,
                d.getPrice(),
                d.getOriginalPrice(),
                unit,
                d.isSignature(),
                d.getThumbnailUrl(),
                parseList(ingredientsRaw),
                parseList(d.getAllergens()),
                d.isHasPeanuts(),
                d.isHasSeafood(),
                d.isHasGluten(),
                imageResponses,
                d.getCreatedAt()
        );
    }

    private List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("[,;\\n]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
