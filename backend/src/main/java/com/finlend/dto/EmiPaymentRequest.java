
package com.finlend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record EmiPaymentRequest(

    @NotNull
    @Positive
    Integer installmentNumber,

    @NotNull
    @Positive
    BigDecimal amount

) {}
