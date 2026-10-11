
package com.finlend.service;

import com.finlend.dto.LoanApplicationAuditResponse;
import com.finlend.dto.LoanDecisionRequest;
import com.finlend.entity.AppUser;
import com.finlend.entity.LoanApplication;
import com.finlend.entity.LoanApplicationAudit;
import com.finlend.entity.LoanApplicationStatus;
import com.finlend.entity.Role;
import com.finlend.repository.AppUserRepository;
import com.finlend.repository.LoanApplicationAuditRepository;
import com.finlend.repository.LoanApplicationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LoanReviewService {

    private final LoanApplicationRepository applicationRepository;
    private final LoanApplicationAuditRepository auditRepository;
    private final AppUserRepository userRepository;

    public LoanReviewService(
            LoanApplicationRepository applicationRepository,
            LoanApplicationAuditRepository auditRepository,
            AppUserRepository userRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LoanApplicationAuditResponse startReview(
            Long applicationId,
            LoanDecisionRequest request,
            Authentication authentication
    ) {
        return changeStatus(
            applicationId,
            LoanApplicationStatus.PENDING,
            LoanApplicationStatus.UNDER_REVIEW,
            request.remarks(),
            authentication
        );
    }

    @Transactional
    public LoanApplicationAuditResponse approve(
            Long applicationId,
            LoanDecisionRequest request,
            Authentication authentication
    ) {
        return changeStatus(
            applicationId,
            LoanApplicationStatus.UNDER_REVIEW,
            LoanApplicationStatus.APPROVED,
            request.remarks(),
            authentication
        );
    }

    @Transactional
    public LoanApplicationAuditResponse reject(
            Long applicationId,
            LoanDecisionRequest request,
            Authentication authentication
    ) {
        return changeStatus(
            applicationId,
            LoanApplicationStatus.UNDER_REVIEW,
            LoanApplicationStatus.REJECTED,
            request.remarks(),
            authentication
        );
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationAuditResponse> getAuditHistory(
            Long applicationId,
            Authentication authentication
    ) {
        getAdmin(authentication);
        findApplication(applicationId);

        return auditRepository
            .findByLoanApplication_IdOrderByChangedAtAscIdAsc(
                applicationId
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private LoanApplicationAuditResponse changeStatus(
            Long applicationId,
            LoanApplicationStatus expectedStatus,
            LoanApplicationStatus nextStatus,
            String remarks,
            Authentication authentication
    ) {
        AppUser reviewer = getAdmin(authentication);
        LoanApplication application = findApplication(applicationId);

        if (application.getStatus() != expectedStatus) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Invalid status transition. Current status: "
                    + application.getStatus()
            );
        }

        LoanApplicationAudit audit = new LoanApplicationAudit();
        audit.setLoanApplication(application);
        audit.setReviewer(reviewer);
        audit.setPreviousStatus(application.getStatus());
        audit.setNewStatus(nextStatus);
        audit.setRemarks(remarks.trim());

        application.setStatus(nextStatus);

        applicationRepository.saveAndFlush(application);
        auditRepository.saveAndFlush(audit);

        return toResponse(audit);
    }

    private LoanApplication findApplication(Long id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Loan application not found"
            ));
    }

    private AppUser getAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
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

        if (!user.isEnabled() || user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required"
            );
        }

        return user;
    }

    private LoanApplicationAuditResponse toResponse(
            LoanApplicationAudit audit
    ) {
        return new LoanApplicationAuditResponse(
            audit.getId(),
            audit.getLoanApplication().getId(),
            audit.getReviewer().getId(),
            audit.getReviewer().getName(),
            audit.getPreviousStatus(),
            audit.getNewStatus(),
            audit.getRemarks(),
            audit.getChangedAt()
        );
    }
}
