
package com.finlend.dto;

import com.finlend.entity.LoanAccountStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanAccountResponse(
    Long id,
    String accountNumber,
    Long loanApplicationId,
    BigDecimal principalAmount,
    BigDecimal outstandingPrincipal,
    BigDecimal annualInterestRate,
    Integer tenureMonths,
    BigDecimal monthlyEmi,
    LoanAccountStatus status,
    LocalDateTime createdAt
) {}
