package com.finlend.controller;

import com.finlend.entity.AppUser;
import com.finlend.repository.AppUserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
public class UserController {

    private final AppUserRepository userRepository;

    public UserController(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/users/me")
    public Map<String, Object> getProfile(
            Authentication authentication
    ) {
        AppUser user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                    )
                );

        return Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole().name()
        );
    }

    @GetMapping("/api/admin/dashboard")
    public Map<String, String> adminDashboard() {
        return Map.of(
            "message", "Welcome to FinLend Admin Dashboard"
        );
    }
}