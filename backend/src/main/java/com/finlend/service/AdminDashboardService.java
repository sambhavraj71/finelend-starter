
package com.finlend.service;

import com.finlend.dto.AdminDashboardResponse;
import com.finlend.entity.EmiPaymentStatus;
import com.finlend.entity.LoanAccountStatus;
import com.finlend.entity.LoanApplicationStatus;
import com.finlend.entity.Role;

import com.finlend.repository.AppUserRepository;
import com.finlend.repository.LoanApplicationRepository;
import com.finlend.repository.LoanAccountRepository;
import com.finlend.repository.LoanDisbursementRepository;
import com.finlend.repository.EmiInstallmentRepository;
import com.finlend.repository.EmiPaymentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AdminDashboardService {

    private final AppUserRepository userRepository;
    private final LoanApplicationRepository applicationRepository;
    private final LoanAccountRepository accountRepository;
    private final LoanDisbursementRepository disbursementRepository;
    private final EmiInstallmentRepository installmentRepository;
    private final EmiPaymentRepository paymentRepository;

    public AdminDashboardService(
            AppUserRepository userRepository,
            LoanApplicationRepository applicationRepository,
            LoanAccountRepository accountRepository,
            LoanDisbursementRepository disbursementRepository,
            EmiInstallmentRepository installmentRepository,
            EmiPaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.accountRepository = accountRepository;
        this.disbursementRepository = disbursementRepository;
        this.installmentRepository = installmentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getSummary() {

        long totalCustomers =
            userRepository.countByRole(Role.CUSTOMER);

        long totalApplications =
            applicationRepository.count();

        long pendingApplications =
            applicationRepository.countByStatus(
                LoanApplicationStatus.PENDING
            );

        long underReviewApplications =
            applicationRepository.countByStatus(
                LoanApplicationStatus.UNDER_REVIEW
            );

        long approvedApplications =
            applicationRepository.countByStatus(
                LoanApplicationStatus.APPROVED
            );

        long rejectedApplications =
            applicationRepository.countByStatus(
                LoanApplicationStatus.REJECTED
            );

        long totalAccounts = accountRepository.count();

        long activeAccounts =
            accountRepository.countByStatus(
                LoanAccountStatus.ACTIVE
            );

        long closedAccounts =
            accountRepository.countByStatus(
                LoanAccountStatus.CLOSED
            );

        BigDecimal totalDisbursed = zeroIfNull(
            disbursementRepository.sumTotalDisbursed()
        );

        BigDecimal totalCollected = zeroIfNull(
            paymentRepository.sumTotalCollected()
        );

        BigDecimal principalCollected = zeroIfNull(
            paymentRepository.sumTotalPrincipalCollected()
        );

        BigDecimal interestCollected = zeroIfNull(
            paymentRepository.sumTotalInterestCollected()
        );

        BigDecimal outstandingPrincipal = zeroIfNull(
            accountRepository.sumOutstandingPrincipalByStatus(
                LoanAccountStatus.ACTIVE
            )
        );

        long totalInstallments =
            installmentRepository.count();

        long paidInstallments =
            installmentRepository.countByPaymentStatus(
                EmiPaymentStatus.PAID
            );

        long pendingInstallments =
            installmentRepository.countByPaymentStatus(
                EmiPaymentStatus.PENDING
            );

        long overdueInstallments =
            installmentRepository.countByPaymentStatus(
                EmiPaymentStatus.OVERDUE
            );

        return new AdminDashboardResponse(
            totalCustomers,
            totalApplications,
            pendingApplications,
            underReviewApplications,
            approvedApplications,
            rejectedApplications,
            totalAccounts,
            activeAccounts,
            closedAccounts,
            totalDisbursed,
            totalCollected,
            principalCollected,
            interestCollected,
            outstandingPrincipal,
            totalInstallments,
            paidInstallments,
            pendingInstallments,
            overdueInstallments
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null
            ? new BigDecimal("0.00")
            : value;
    }
}
