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
}
