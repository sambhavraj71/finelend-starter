
package com.finlend.dto;

import java.math.BigDecimal;
import java.util.List;

public record LoanRepaymentHistoryResponse(
    Long loanAccountId,
    String accountNumber,
    BigDecimal outstandingPrincipal,
    String loanStatus,
    int totalPayments,
    BigDecimal totalAmountPaid,
    List<EmiPaymentResponse> payments
) {}
