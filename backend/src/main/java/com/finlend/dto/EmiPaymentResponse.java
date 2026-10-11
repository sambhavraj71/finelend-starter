
package com.finlend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EmiPaymentResponse(
    Long paymentId,
    Long loanAccountId,
    Long installmentId,
    Integer installmentNumber,
    BigDecimal amount,
    BigDecimal principalPaid,
    BigDecimal interestPaid,
    BigDecimal outstandingPrincipal,
    String loanStatus,
    String referenceNumber,
    Long processedById,
    LocalDateTime paidAt
) {}
