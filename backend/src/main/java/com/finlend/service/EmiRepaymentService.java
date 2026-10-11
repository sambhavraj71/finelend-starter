
package com.finlend.service;

import com.finlend.dto.EmiPaymentRequest;
import com.finlend.dto.EmiPaymentResponse;
import com.finlend.dto.LoanRepaymentHistoryResponse;

import com.finlend.entity.*;
import com.finlend.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class EmiRepaymentService {

    private final LoanAccountRepository accountRepository;
    private final EmiInstallmentRepository installmentRepository;
    private final EmiPaymentRepository paymentRepository;
    private final AppUserRepository userRepository;

    public EmiRepaymentService(
            LoanAccountRepository accountRepository,
            EmiInstallmentRepository installmentRepository,
            EmiPaymentRepository paymentRepository,
            AppUserRepository userRepository
    ) {
        this.accountRepository = accountRepository;
        this.installmentRepository = installmentRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EmiPaymentResponse recordPayment(
            Long accountId,
            EmiPaymentRequest request,
            Authentication authentication
    ) {
        AppUser admin = requireAdmin(authentication);

        LoanAccount account = accountRepository
            .findByIdForUpdate(accountId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan account not found"
            ));

        if (account.getStatus() != LoanAccountStatus.ACTIVE) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Loan account is not active"
            );
        }

        EmiInstallment installment = installmentRepository
            .findFirstByLoanAccount_IdAndPaymentStatusInOrderByInstallmentNumberAsc(
                accountId,
                List.of(
                    EmiPaymentStatus.PENDING,
                    EmiPaymentStatus.OVERDUE
                )
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No unpaid EMI installments found"
            ));

        if (!installment.getInstallmentNumber()
                .equals(request.installmentNumber())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Pay the earliest unpaid installment first"
            );
        }

        if (installment.getPaymentStatus() == EmiPaymentStatus.PAID
                || paymentRepository.existsByInstallment_Id(
                    installment.getId()
                )) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Installment already paid"
            );
        }

        BigDecimal amount = request.amount()
            .setScale(2, RoundingMode.HALF_UP);

        if (request.amount().compareTo(amount) != 0
                || amount.compareTo(
                    installment.getEmiAmount()
                ) != 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Payment amount must exactly match scheduled EMI"
            );
        }

        BigDecimal outstanding = account
            .getOutstandingPrincipal()
            .subtract(installment.getPrincipalComponent())
            .setScale(2, RoundingMode.HALF_UP);

        if (outstanding.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Payment would make outstanding principal negative"
            );
        }

        EmiPayment payment = new EmiPayment();
        payment.setLoanAccount(account);
        payment.setInstallment(installment);
        payment.setProcessedBy(admin);
        payment.setAmount(amount);
        payment.setReferenceNumber(
            "EMI-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase()
        );

        installment.setPaymentStatus(EmiPaymentStatus.PAID);
        account.setOutstandingPrincipal(outstanding);

        long unpaidCount = installmentRepository
            .countByLoanAccount_IdAndPaymentStatusNot(
                accountId,
                EmiPaymentStatus.PAID
            );

        // The updated installment is part of this transaction.
        // Flush before counting so the query sees its new status.
        installmentRepository.saveAndFlush(installment);

        unpaidCount = installmentRepository
            .countByLoanAccount_IdAndPaymentStatusNot(
                accountId,
                EmiPaymentStatus.PAID
            );

        if (unpaidCount == 0) {
            if (outstanding.compareTo(BigDecimal.ZERO) != 0) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Final payment did not settle the loan principal"
                );
            }
            account.setStatus(LoanAccountStatus.CLOSED);
        }

        accountRepository.save(account);

        EmiPayment saved = paymentRepository.saveAndFlush(payment);

        return toResponse(saved, account);
    }

    @Transactional(readOnly = true)
    public LoanRepaymentHistoryResponse getAdminHistory(
            Long accountId,
            Authentication authentication
    ) {
        requireAdmin(authentication);

        LoanAccount account = findAccount(accountId);

        return buildHistory(account);
    }

    @Transactional(readOnly = true)
    public LoanRepaymentHistoryResponse getCustomerHistory(
            Long accountId,
            Authentication authentication
    ) {
        AppUser customer = getCurrentUser(authentication);

        if (!customer.isEnabled()
                || customer.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Customer access required"
            );
        }

        LoanAccount account = findAccount(accountId);

        if (!account.getLoanApplication()
                .getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan account not found"
            );
        }

        return buildHistory(account);
    }

    private LoanRepaymentHistoryResponse buildHistory(
            LoanAccount account
    ) {
        List<EmiPayment> payments = paymentRepository
            .findByLoanAccount_IdOrderByInstallment_InstallmentNumberAsc(
                account.getId()
            );

        List<EmiPaymentResponse> items = payments.stream()
            .map(p -> toResponse(p, account))
            .toList();

        BigDecimal totalPaid = payments.stream()
            .map(EmiPayment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new LoanRepaymentHistoryResponse(
            account.getId(),
            account.getAccountNumber(),
            account.getOutstandingPrincipal(),
            account.getStatus().name(),
            payments.size(),
            totalPaid.setScale(2, RoundingMode.HALF_UP),
            items
        );
    }

    private EmiPaymentResponse toResponse(
            EmiPayment payment,
            LoanAccount account
    ) {
        EmiInstallment installment = payment.getInstallment();

        return new EmiPaymentResponse(
            payment.getId(),
            account.getId(),
            installment.getId(),
            installment.getInstallmentNumber(),
            payment.getAmount(),
            installment.getPrincipalComponent(),
            installment.getInterestComponent(),
            account.getOutstandingPrincipal(),
            account.getStatus().name(),
            payment.getReferenceNumber(),
            payment.getProcessedBy().getId(),
            payment.getPaidAt()
        );
    }

    private LoanAccount findAccount(Long accountId) {
        return accountRepository.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan account not found"
            ));
    }

    private AppUser getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required"
            );
        }

        return userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User not found"
            ));
    }

    private AppUser requireAdmin(Authentication authentication) {
        AppUser user = getCurrentUser(authentication);

        if (!user.isEnabled() || user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required"
            );
        }

        return user;
    }
}
