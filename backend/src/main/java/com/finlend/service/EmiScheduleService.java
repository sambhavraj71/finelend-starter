
package com.finlend.service;

import com.finlend.dto.EmiInstallmentResponse;
import com.finlend.dto.EmiScheduleResponse;
import com.finlend.entity.AppUser;
import com.finlend.entity.EmiInstallment;
import com.finlend.entity.EmiPaymentStatus;
import com.finlend.entity.LoanAccount;
import com.finlend.entity.LoanAccountStatus;
import com.finlend.entity.Role;
import com.finlend.repository.AppUserRepository;
import com.finlend.repository.EmiInstallmentRepository;
import com.finlend.repository.LoanAccountRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class EmiScheduleService {

    private static final BigDecimal TWELVE_HUNDRED =
        new BigDecimal("1200");

    private final LoanAccountRepository accountRepository;
    private final EmiInstallmentRepository installmentRepository;
    private final AppUserRepository userRepository;

    public EmiScheduleService(
            LoanAccountRepository accountRepository,
            EmiInstallmentRepository installmentRepository,
            AppUserRepository userRepository
    ) {
        this.accountRepository = accountRepository;
        this.installmentRepository = installmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EmiScheduleResponse generateSchedule(
            Long accountId,
            Authentication authentication
    ) {
        requireAdmin(authentication);

        LoanAccount account = accountRepository
            .findByIdForUpdate(accountId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan account not found"
            ));

        if (account.getStatus() != LoanAccountStatus.ACTIVE) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only active loan accounts can have a schedule"
            );
        }

        if (installmentRepository.existsByLoanAccount_Id(accountId)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "EMI schedule already generated"
            );
        }

        BigDecimal balance = account.getPrincipalAmount()
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal monthlyRate = account.getAnnualInterestRate()
            .divide(TWELVE_HUNDRED, 12, RoundingMode.HALF_UP);

        BigDecimal regularEmi = account.getMonthlyEmi()
            .setScale(2, RoundingMode.HALF_UP);

        int tenure = account.getTenureMonths();

        LocalDate firstDueDate = account.getCreatedAt()
            .toLocalDate()
            .plusMonths(1);

        List<EmiInstallment> installments = new ArrayList<>();

        for (int month = 1; month <= tenure; month++) {

            BigDecimal openingBalance = balance;

            BigDecimal interest = openingBalance
                .multiply(monthlyRate)
                .setScale(2, RoundingMode.HALF_UP);

            BigDecimal principal;
            BigDecimal emi;

            if (month == tenure) {
                principal = openingBalance;
                emi = principal.add(interest);
            } else {
                principal = regularEmi.subtract(interest);

                if (principal.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "EMI does not cover monthly interest"
                    );
                }

                if (principal.compareTo(openingBalance) > 0) {
                    throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "EMI schedule parameters are inconsistent"
                    );
                }

                emi = regularEmi;
            }

            balance = openingBalance.subtract(principal)
                .setScale(2, RoundingMode.HALF_UP);

            EmiInstallment installment = new EmiInstallment();

            installment.setLoanAccount(account);
            installment.setInstallmentNumber(month);
            installment.setDueDate(firstDueDate.plusMonths(month - 1L));
            installment.setOpeningBalance(openingBalance);
            installment.setEmiAmount(emi);
            installment.setPrincipalComponent(principal);
            installment.setInterestComponent(interest);
            installment.setClosingBalance(balance);
            installment.setPaymentStatus(EmiPaymentStatus.PENDING);

            installments.add(installment);
        }

        installmentRepository.saveAllAndFlush(installments);

        return buildResponse(account, installments);
    }

    @Transactional(readOnly = true)
    public EmiScheduleResponse getAdminSchedule(
            Long accountId,
            Authentication authentication
    ) {
        requireAdmin(authentication);

        LoanAccount account = findAccount(accountId);

        return buildResponse(
            account,
            getInstallmentsOrThrow(accountId)
        );
    }

    @Transactional(readOnly = true)
    public EmiScheduleResponse getCustomerSchedule(
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

        return buildResponse(
            account,
            getInstallmentsOrThrow(accountId)
        );
    }

    private List<EmiInstallment> getInstallmentsOrThrow(
            Long accountId
    ) {
        List<EmiInstallment> installments =
            installmentRepository
                .findByLoanAccount_IdOrderByInstallmentNumberAsc(
                    accountId
                );

        if (installments.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "EMI schedule not generated yet"
            );
        }

        return installments;
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

    private void requireAdmin(Authentication authentication) {
        AppUser user = getCurrentUser(authentication);

        if (!user.isEnabled() || user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required"
            );
        }
    }

    private EmiScheduleResponse buildResponse(
            LoanAccount account,
            List<EmiInstallment> installments
    ) {
        List<EmiInstallmentResponse> items = installments
            .stream()
            .map(i -> new EmiInstallmentResponse(
                i.getId(),
                i.getInstallmentNumber(),
                i.getDueDate(),
                i.getOpeningBalance(),
                i.getEmiAmount(),
                i.getPrincipalComponent(),
                i.getInterestComponent(),
                i.getClosingBalance(),
                i.getPaymentStatus()
            ))
            .toList();

        BigDecimal totalPayment = installments.stream()
            .map(EmiInstallment::getEmiAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInterest = installments.stream()
            .map(EmiInstallment::getInterestComponent)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new EmiScheduleResponse(
            account.getId(),
            account.getAccountNumber(),
            account.getPrincipalAmount(),
            account.getAnnualInterestRate(),
            account.getTenureMonths(),
            account.getMonthlyEmi(),
            totalPayment.setScale(2, RoundingMode.HALF_UP),
            totalInterest.setScale(2, RoundingMode.HALF_UP),
            items
        );
    }
}
