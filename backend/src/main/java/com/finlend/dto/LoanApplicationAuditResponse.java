
package com.finlend.dto;

import com.finlend.entity.LoanApplicationStatus;
import java.time.LocalDateTime;

public record LoanApplicationAuditResponse(
    Long id,
    Long loanApplicationId,
    Long reviewerId,
    String reviewerName,
    LoanApplicationStatus previousStatus,
    LoanApplicationStatus newStatus,
    String remarks,
    LocalDateTime changedAt
) {}
