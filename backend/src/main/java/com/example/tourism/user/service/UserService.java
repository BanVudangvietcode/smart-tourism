package com.example.tourism.user.service;

import com.example.tourism.user.dto.UserProfileUpdateRequest;
import com.example.tourism.user.model.User;
import com.example.tourism.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get user by ID. Throws if not found.
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
    }

    /**
     * Update user profile (display name, avatar, food preferences).
     * Only non-null fields in the request are applied.
     */
    public User updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getUserById(userId);

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getSpicy() != null) {
            user.setSpicy(request.getSpicy());
        }
        if (request.getVegetarian() != null) {
            user.setVegetarian(request.getVegetarian());
        }
        if (request.getNoSeafood() != null) {
            user.setNoSeafood(request.getNoSeafood());
        }

        return userRepository.save(user);
    }
}
