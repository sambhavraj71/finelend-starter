package com.finlend.service;

import com.finlend.dto.AuthResponse;
import com.finlend.dto.LoginRequest;
import com.finlend.dto.RegisterRequest;
import com.finlend.entity.AppUser;
import com.finlend.entity.Role;
import com.finlend.repository.AppUserRepository;
import com.finlend.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email already registered"
            );
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(
            passwordEncoder.encode(request.password())
        );
        user.setRole(Role.CUSTOMER);
        user.setEnabled(true);

        AppUser saved = userRepository.save(user);

        return createResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                    )
                );

        if (!user.isEnabled() ||
            !passwordEncoder.matches(
                request.password(),
                user.getPassword()
            )) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        return createResponse(user);
    }

    private AuthResponse createResponse(AppUser user) {

        return new AuthResponse(
            jwtService.generateToken(user),
            "Bearer",
            jwtService.getExpirationSeconds(),
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole().name()
        );
    }
}