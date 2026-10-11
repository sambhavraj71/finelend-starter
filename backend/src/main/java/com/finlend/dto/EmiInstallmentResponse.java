
package com.finlend.dto;

import com.finlend.entity.EmiPaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmiInstallmentResponse(
    Long id,
    Integer installmentNumber,
    LocalDate dueDate,
    BigDecimal openingBalance,
    BigDecimal emiAmount,
    BigDecimal principalComponent,
    BigDecimal interestComponent,
    BigDecimal closingBalance,
    EmiPaymentStatus paymentStatus
) {}
