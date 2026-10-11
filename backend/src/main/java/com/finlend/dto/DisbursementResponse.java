
package com.finlend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DisbursementResponse(
    Long id,
    Long loanAccountId,
    String accountNumber,
    Long loanApplicationId,
    BigDecimal amount,
    String referenceNumber,
    Long processedById,
    LocalDateTime disbursedAt
) {}
