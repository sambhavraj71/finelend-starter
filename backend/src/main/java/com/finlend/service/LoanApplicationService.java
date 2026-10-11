
package com.finlend.service;

import com.finlend.dto.*;
import com.finlend.entity.*;
import com.finlend.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

@Service
public class LoanApplicationService {

    private final LoanApplicationRepository applicationRepository;
    private final LoanProductRepository productRepository;
    private final AppUserRepository userRepository;

    public LoanApplicationService(
            LoanApplicationRepository applicationRepository,
            LoanProductRepository productRepository,
            AppUserRepository userRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LoanApplicationResponse apply(
            LoanApplicationRequest request,
            Authentication authentication
    ) {
        AppUser customer = getCurrentUser(authentication);

        if (customer.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only customers can apply for loans"
            );
        }

        LoanProduct product = productRepository
                .findById(request.loanProductId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Loan product not found"
                ));

        if (!product.isActive()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Loan product is inactive"
            );
        }

        if (request.requestedAmount()
                .compareTo(product.getMinAmount()) < 0
                || request.requestedAmount()
                .compareTo(product.getMaxAmount()) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Requested amount is outside product limits"
            );
        }

        if (request.tenureMonths() < product.getMinTenureMonths()
                || request.tenureMonths() > product.getMaxTenureMonths()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Requested tenure is outside product limits"
            );
        }

        BigDecimal emi = calculateEmi(
            request.requestedAmount(),
            product.getAnnualInterestRate(),
            request.tenureMonths()
        );

        LoanApplication application = new LoanApplication();
        application.setCustomer(customer);
        application.setLoanProduct(product);
        application.setRequestedAmount(request.requestedAmount());
        application.setTenureMonths(request.tenureMonths());
        application.setMonthlyIncome(request.monthlyIncome());
        application.setEmploymentType(
            request.employmentType().trim()
        );
        application.setAnnualInterestRate(
            product.getAnnualInterestRate()
        );
        application.setEstimatedEmi(emi);
        application.setStatus(LoanApplicationStatus.PENDING);

        return toResponse(applicationRepository.saveAndFlush(application));
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationResponse> getMyApplications(
            Authentication authentication
    ) {
        AppUser customer = getCurrentUser(authentication);

        return applicationRepository
                .findByCustomer_IdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LoanApplicationResponse getById(
            Long id,
            Authentication authentication
    ) {
        AppUser customer = getCurrentUser(authentication);

        LoanApplication application = applicationRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Loan application not found"
                ));

        if (!application.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan application not found"
            );
        }

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationResponse> getAllApplications() {
        return applicationRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AppUser getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Authentication required"
            );
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "User not found"
                ));
    }

    private BigDecimal calculateEmi(
            BigDecimal principal,
            BigDecimal annualRate,
            int months
    ) {
        MathContext mc = new MathContext(20, RoundingMode.HALF_UP);

        BigDecimal monthlyRate = annualRate.divide(
            new BigDecimal("1200"), mc
        );

        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(
                BigDecimal.valueOf(months),
                2,
                RoundingMode.HALF_UP
            );
        }

        BigDecimal onePlusRate =
                BigDecimal.ONE.add(monthlyRate, mc);

        BigDecimal factor = onePlusRate.pow(months, mc);

        BigDecimal numerator = principal
                .multiply(monthlyRate, mc)
                .multiply(factor, mc);

        BigDecimal denominator = factor.subtract(BigDecimal.ONE, mc);

        return numerator.divide(
            denominator, 2, RoundingMode.HALF_UP
        );
    }

    private LoanApplicationResponse toResponse(
            LoanApplication application
    ) {
        return new LoanApplicationResponse(
            application.getId(),
            application.getCustomer().getId(),
            application.getLoanProduct().getId(),
            application.getLoanProduct().getName(),
            application.getRequestedAmount(),
            application.getTenureMonths(),
            application.getMonthlyIncome(),
            application.getEmploymentType(),
            application.getAnnualInterestRate(),
            application.getEstimatedEmi(),
            application.getStatus(),
            application.getCreatedAt(),
            application.getUpdatedAt()
        );
    }
}
