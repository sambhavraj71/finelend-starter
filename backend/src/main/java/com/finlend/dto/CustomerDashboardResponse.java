
package com.finlend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CustomerDashboardResponse(
    Long customerId,
    String customerEmail,
    long totalApplications,
    long totalLoanAccounts,
    long activeLoans,
    long closedLoans,
    BigDecimal totalBorrowed,
    BigDecimal totalOutstandingPrincipal,
    BigDecimal totalEmiPaid,
    BigDecimal totalPrincipalPaid,
    BigDecimal totalInterestPaid,
    long totalInstallments,
    long paidInstallments,
    long remainingInstallments,
    List<UpcomingEmi> upcomingEmis
) {
    public record UpcomingEmi(
        Long loanAccountId,
        String accountNumber,
        Long installmentId,
        Integer installmentNumber,
        LocalDate dueDate,
        BigDecimal emiAmount,
        String paymentStatus
    ) {}
}
