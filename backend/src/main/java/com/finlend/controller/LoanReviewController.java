
package com.finlend.controller;

import com.finlend.dto.LoanApplicationAuditResponse;
import com.finlend.dto.LoanDecisionRequest;
import com.finlend.service.LoanReviewService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/loan-applications")
public class LoanReviewController {

    private final LoanReviewService service;

    public LoanReviewController(LoanReviewService service) {
        this.service = service;
    }

    @PatchMapping("/{id}/start-review")
    public LoanApplicationAuditResponse startReview(
            @PathVariable Long id,
            @Valid @RequestBody LoanDecisionRequest request,
            Authentication authentication
    ) {
        return service.startReview(id, request, authentication);
    }

    @PatchMapping("/{id}/approve")
    public LoanApplicationAuditResponse approve(
            @PathVariable Long id,
            @Valid @RequestBody LoanDecisionRequest request,
            Authentication authentication
    ) {
        return service.approve(id, request, authentication);
    }

    @PatchMapping("/{id}/reject")
    public LoanApplicationAuditResponse reject(
            @PathVariable Long id,
            @Valid @RequestBody LoanDecisionRequest request,
            Authentication authentication
    ) {
        return service.reject(id, request, authentication);
    }

    @GetMapping("/{id}/audit")
    public List<LoanApplicationAuditResponse> getAuditHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getAuditHistory(id, authentication);
    }
}
