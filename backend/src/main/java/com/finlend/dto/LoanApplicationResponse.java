
package com.finlend.dto;

import com.finlend.entity.LoanApplicationStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanApplicationResponse(
    Long id,
    Long customerId,
    Long loanProductId,
    String loanProductName,
    BigDecimal requestedAmount,
    Integer tenureMonths,
    BigDecimal monthlyIncome,
    String employmentType,
    BigDecimal annualInterestRate,
    BigDecimal estimatedEmi,
    LoanApplicationStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
