package com.example.tourism.admin.service;

import com.example.tourism.admin.dto.AdminUserResponse;
import com.example.tourism.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<AdminUserResponse> getAdminUsers() {
        return userRepository.findAdminUsersWithStats();
    }

    public void updateUserRole(Long currentAdminId, Long targetUserId, String newRole) {
        if (targetUserId == null || newRole == null || newRole.isBlank()) {
            throw new IllegalArgumentException("Thông tin cập nhật vai trò không hợp lệ.");
        }
        String normalizedRole = newRole.trim().toUpperCase();
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        if (!"ADMIN".equals(normalizedRole) && !"USER".equals(normalizedRole)) {
            throw new IllegalArgumentException("Vai trò không hợp lệ: phải là ROLE_ADMIN hoặc ROLE_USER.");
        }

        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + targetUserId));

        if (targetUserId.equals(currentAdminId) && "USER".equals(normalizedRole)) {
            throw new IllegalArgumentException("Bạn không thể tự hạ quyền Quản trị viên của chính tài khoản đang đăng nhập.");
        }

        userRepository.updateRole(targetUserId, normalizedRole);
    }

    public void updateUserLockStatus(Long currentAdminId, Long targetUserId, boolean locked) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("ID người dùng không hợp lệ.");
        }
        if (targetUserId.equals(currentAdminId) && locked) {
            throw new IllegalArgumentException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + targetUserId));

        userRepository.updateUserLockStatus(targetUserId, locked);
    }

    public void deleteUser(Long currentAdminId, Long targetUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("ID người dùng không hợp lệ.");
        }
        if (targetUserId.equals(currentAdminId)) {
            throw new IllegalArgumentException("Bạn không thể tự xóa tài khoản của chính mình.");
        }

        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + targetUserId));

        userRepository.deleteUser(targetUserId);
    }
}
