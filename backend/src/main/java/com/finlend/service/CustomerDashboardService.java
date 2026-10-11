
package com.finlend.service;

import com.finlend.dto.CustomerDashboardResponse;
import com.finlend.dto.CustomerDashboardResponse.UpcomingEmi;

import com.finlend.entity.AppUser;
import com.finlend.entity.EmiInstallment;
import com.finlend.entity.EmiPayment;
import com.finlend.entity.EmiPaymentStatus;
import com.finlend.entity.LoanAccount;
import com.finlend.entity.LoanAccountStatus;
import com.finlend.entity.Role;

import com.finlend.repository.AppUserRepository;
import com.finlend.repository.LoanApplicationRepository;
import com.finlend.repository.LoanAccountRepository;
import com.finlend.repository.EmiInstallmentRepository;
import com.finlend.repository.EmiPaymentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CustomerDashboardService {

    private final AppUserRepository userRepository;
    private final LoanApplicationRepository applicationRepository;
    private final LoanAccountRepository accountRepository;
    private final EmiInstallmentRepository installmentRepository;
    private final EmiPaymentRepository paymentRepository;

    public CustomerDashboardService(
            AppUserRepository userRepository,
            LoanApplicationRepository applicationRepository,
            LoanAccountRepository accountRepository,
            EmiInstallmentRepository installmentRepository,
            EmiPaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.accountRepository = accountRepository;
        this.installmentRepository = installmentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public CustomerDashboardResponse getSummary(
            Authentication authentication
    ) {
        AppUser customer = getCurrentCustomer(authentication);

        Long customerId = customer.getId();

        long totalApplications =
            applicationRepository.countByCustomer_Id(customerId);

        List<LoanAccount> accounts = accountRepository
            .findByLoanApplication_Customer_IdOrderByCreatedAtDesc(
                customerId
            );

        long activeLoans = 0;
        long closedLoans = 0;
        long totalInstallments = 0;
        long paidInstallments = 0;

        BigDecimal totalBorrowed = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalEmiPaid = BigDecimal.ZERO;
        BigDecimal totalPrincipalPaid = BigDecimal.ZERO;
        BigDecimal totalInterestPaid = BigDecimal.ZERO;

        List<UpcomingEmi> upcomingEmis = new ArrayList<>();

        for (LoanAccount account : accounts) {

            if (account.getStatus() == LoanAccountStatus.ACTIVE) {
                activeLoans++;
            } else if (account.getStatus() == LoanAccountStatus.CLOSED) {
                closedLoans++;
            }

            totalBorrowed = totalBorrowed.add(
                account.getPrincipalAmount()
            );

            totalOutstanding = totalOutstanding.add(
                account.getOutstandingPrincipal()
            );

            List<EmiInstallment> installments =
                installmentRepository
                    .findByLoanAccount_IdOrderByInstallmentNumberAsc(
                        account.getId()
                    );

            totalInstallments += installments.size();

            for (EmiInstallment installment : installments) {
                if (installment.getPaymentStatus()
                        == EmiPaymentStatus.PAID) {
                    paidInstallments++;
                }
            }

            List<EmiPayment> payments = paymentRepository
                .findByLoanAccount_IdOrderByInstallment_InstallmentNumberAsc(
                    account.getId()
                );

            for (EmiPayment payment : payments) {

                totalEmiPaid = totalEmiPaid.add(
                    payment.getAmount()
                );

                totalPrincipalPaid = totalPrincipalPaid.add(
                    payment.getInstallment().getPrincipalComponent()
                );

                totalInterestPaid = totalInterestPaid.add(
                    payment.getInstallment().getInterestComponent()
                );
            }

            if (account.getStatus() == LoanAccountStatus.ACTIVE) {

                for (EmiInstallment installment : installments) {

                    if (installment.getPaymentStatus()
                            != EmiPaymentStatus.PAID) {

                        upcomingEmis.add(new UpcomingEmi(
                            account.getId(),
                            account.getAccountNumber(),
                            installment.getId(),
                            installment.getInstallmentNumber(),
                            installment.getDueDate(),
                            installment.getEmiAmount(),
                            installment.getPaymentStatus().name()
                        ));

                        break;
                    }
                }
            }
        }

        upcomingEmis.sort(
            Comparator.comparing(UpcomingEmi::dueDate)
        );

        long remainingInstallments =
            totalInstallments - paidInstallments;

        return new CustomerDashboardResponse(
            customerId,
            customer.getEmail(),
            totalApplications,
            accounts.size(),
            activeLoans,
            closedLoans,
            totalBorrowed,
            totalOutstanding,
            totalEmiPaid,
            totalPrincipalPaid,
            totalInterestPaid,
            totalInstallments,
            paidInstallments,
            remainingInstallments,
            upcomingEmis
        );
    }

    private AppUser getCurrentCustomer(
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required"
            );
        }

        AppUser user = userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User not found"
            ));

        if (!user.isEnabled()
                || user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Customer access required"
            );
        }

        return user;
    }
}
