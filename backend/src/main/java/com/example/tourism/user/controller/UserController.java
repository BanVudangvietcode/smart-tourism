package com.example.tourism.user.controller;

import com.example.tourism.user.dto.UserProfileResponse;
import com.example.tourism.user.dto.UserProfileUpdateRequest;
import com.example.tourism.user.model.User;
import com.example.tourism.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lấy hồ sơ cá nhân (tên hiển thị, avatar, sở thích ẩm thực).
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(UserProfileResponse.fromUser(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Cập nhật hồ sơ cá nhân (tên hiển thị, avatar, sở thích ẩm thực:
     * ăn cay, ăn chay, kiêng hải sản).
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(HttpServletRequest request,
                                              @RequestBody UserProfileUpdateRequest updateRequest) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            User user = userService.updateProfile(userId, updateRequest);
            return ResponseEntity.ok(UserProfileResponse.fromUser(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
