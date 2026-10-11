package com.finlend.dto;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    Long userId,
    String name,
    String email,
    String role
) {}