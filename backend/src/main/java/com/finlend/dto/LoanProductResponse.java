
package com.finlend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanProductResponse(
    Long id,
    String code,
    String name,
    String description,
    BigDecimal minAmount,
    BigDecimal maxAmount,
    BigDecimal annualInterestRate,
    Integer minTenureMonths,
    Integer maxTenureMonths,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
