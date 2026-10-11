
package com.finlend.dto;

import java.math.BigDecimal;

public record AdminDashboardResponse(
    long totalCustomers,
    long totalLoanApplications,
    long pendingApplications,
    long underReviewApplications,
    long approvedApplications,
    long rejectedApplications,
    long totalLoanAccounts,
    long activeLoanAccounts,
    long closedLoanAccounts,
    BigDecimal totalDisbursed,
    BigDecimal totalCollected,
    BigDecimal totalPrincipalCollected,
    BigDecimal totalInterestCollected,
    BigDecimal totalOutstandingPrincipal,
    long totalEmiInstallments,
    long paidEmiInstallments,
    long pendingEmiInstallments,
    long overdueEmiInstallments
) {}
