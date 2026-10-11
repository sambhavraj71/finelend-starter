
package com.finlend.dto;

import java.math.BigDecimal;
import java.util.List;

public record EmiScheduleResponse(
    Long loanAccountId,
    String accountNumber,
    BigDecimal principalAmount,
    BigDecimal annualInterestRate,
    Integer tenureMonths,
    BigDecimal regularMonthlyEmi,
    BigDecimal totalScheduledPayment,
    BigDecimal totalScheduledInterest,
    List<EmiInstallmentResponse> installments
) {}
