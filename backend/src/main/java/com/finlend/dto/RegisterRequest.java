package com.finlend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @NotBlank
    @Size(min = 2, max = 100)
    String name,

    @NotBlank
    @Email
    String email,

    @NotBlank
    @Size(min = 12, max = 128)
    String password

) {}