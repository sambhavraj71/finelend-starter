
package com.finlend.service;

import com.finlend.dto.*;
import com.finlend.entity.*;
import com.finlend.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class LoanDisbursementService {

    private final LoanApplicationRepository applicationRepository;
    private final LoanAccountRepository accountRepository;
    private final LoanDisbursementRepository disbursementRepository;
    private final AppUserRepository userRepository;
    private final EmiScheduleService emiScheduleService;

    public LoanDisbursementService(
            LoanApplicationRepository applicationRepository,
            LoanAccountRepository accountRepository,
            LoanDisbursementRepository disbursementRepository,
            AppUserRepository userRepository,
            EmiScheduleService emiScheduleService) {
        this.applicationRepository = applicationRepository;
        this.accountRepository = accountRepository;
        this.disbursementRepository = disbursementRepository;
        this.userRepository = userRepository;
        this.emiScheduleService = emiScheduleService;
    }

    @Transactional
    public DisbursementResponse disburse(
            DisbursementRequest request,
            Authentication authentication) {
        AppUser admin = getCurrentUser(authentication);

        if (!admin.isEnabled() || admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin access required");
        }

        LoanApplication application = applicationRepository
                .findByIdForUpdate(request.loanApplicationId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Loan application not found"));

        if (application.getStatus() != LoanApplicationStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved applications can be disbursed");
        }

        if (accountRepository.existsByLoanApplication_Id(
                application.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Loan already disbursed");
        }

        LoanAccount account = new LoanAccount();

        account.setAccountNumber(
                "FL-" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase());

        account.setLoanApplication(application);
        account.setPrincipalAmount(application.getRequestedAmount());
        account.setOutstandingPrincipal(
                application.getRequestedAmount());
        account.setAnnualInterestRate(
                application.getAnnualInterestRate());
        account.setTenureMonths(application.getTenureMonths());
        account.setMonthlyEmi(application.getEstimatedEmi());
        account.setStatus(LoanAccountStatus.ACTIVE);

        LoanAccount savedAccount = accountRepository.saveAndFlush(account);

        LoanDisbursement disbursement = new LoanDisbursement();

        disbursement.setLoanAccount(savedAccount);
        disbursement.setProcessedBy(admin);
        disbursement.setAmount(application.getRequestedAmount());

        disbursement.setReferenceNumber(
                "DISB-" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .toUpperCase());

        LoanDisbursement saved = disbursementRepository.saveAndFlush(disbursement);

        emiScheduleService.generateSchedule(
                savedAccount.getId(),
                authentication);

        return toDisbursementResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DisbursementResponse> getAllDisbursements() {
        return disbursementRepository
                .findAllByOrderByDisbursedAtDesc()
                .stream()
                .map(this::toDisbursementResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DisbursementResponse getDisbursement(Long id) {
        LoanDisbursement disbursement = disbursementRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Disbursement not found"));

        return toDisbursementResponse(disbursement);
    }

    @Transactional(readOnly = true)
    public List<LoanAccountResponse> getMyAccounts(
            Authentication authentication) {
        AppUser customer = requireCustomer(authentication);

        return accountRepository
                .findByLoanApplication_Customer_IdOrderByCreatedAtDesc(
                        customer.getId())
                .stream()
                .map(this::toAccountResponse)
                .toList();
    }

    @Transactional(readOnly = true)

    public LoanAccountResponse getMyAccountById(
            Long id,
            Authentication authentication) {
        AppUser customer = requireCustomer(authentication);

        LoanAccount account = accountRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Loan account not found"));

        if (!account.getLoanApplication()
                .getCustomer()
                .getId()
                .equals(customer.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Loan account not found");
        }

        return toAccountResponse(account);
    }

    private AppUser getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));
    }

    private AppUser requireCustomer(Authentication authentication) {
        AppUser user = getCurrentUser(authentication);

        if (!user.isEnabled() || user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Customer access required");
        }

        return user;
    }

    private DisbursementResponse toDisbursementResponse(
            LoanDisbursement disbursement) {
        LoanAccount account = disbursement.getLoanAccount();

        return new DisbursementResponse(
                disbursement.getId(),
                account.getId(),
                account.getAccountNumber(),
                account.getLoanApplication().getId(),
                disbursement.getAmount(),
                disbursement.getReferenceNumber(),
                disbursement.getProcessedBy().getId(),
                disbursement.getDisbursedAt());
    }

    private LoanAccountResponse toAccountResponse(
            LoanAccount account) {
        return new LoanAccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getLoanApplication().getId(),
                account.getPrincipalAmount(),
                account.getOutstandingPrincipal(),
                account.getAnnualInterestRate(),
                account.getTenureMonths(),
                account.getMonthlyEmi(),
                account.getStatus(),
                account.getCreatedAt());
    }
}
