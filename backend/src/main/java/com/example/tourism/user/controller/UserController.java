package com.example.tourism.user.controller;

import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.user.dto.UserProfileResponse;
import com.example.tourism.user.dto.UserProfileUpdateRequest;
import com.example.tourism.user.model.User;
import com.example.tourism.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * Tự động inject AuthUser từ JWT token thông qua @CurrentUser(required = true).
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@CurrentUser(required = true) AuthUser authUser) {
        User user = userService.getUserById(authUser.id());
        return ResponseEntity.ok(UserProfileResponse.fromUser(user));
    }

    /**
     * Cập nhật hồ sơ cá nhân (tên hiển thị, avatar, sở thích ẩm thực: ăn cay, ăn chay, kiêng hải sản).
     * Tự động inject AuthUser và kiểm tra dữ liệu hợp lệ qua @Valid.
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @CurrentUser(required = true) AuthUser authUser,
            @Valid @RequestBody UserProfileUpdateRequest updateRequest) {
        User user = userService.updateProfile(authUser.id(), updateRequest);
        return ResponseEntity.ok(UserProfileResponse.fromUser(user));
    }
}
