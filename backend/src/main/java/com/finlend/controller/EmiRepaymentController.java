
package com.finlend.controller;

import com.finlend.dto.EmiPaymentRequest;
import com.finlend.dto.EmiPaymentResponse;
import com.finlend.dto.LoanRepaymentHistoryResponse;
import com.finlend.service.EmiRepaymentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class EmiRepaymentController {

    private final EmiRepaymentService service;

    public EmiRepaymentController(EmiRepaymentService service) {
        this.service = service;
    }

    @PostMapping("/api/admin/loan-accounts/{id}/repayments")
    public ResponseEntity<EmiPaymentResponse> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody EmiPaymentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.recordPayment(
                id,
                request,
                authentication
            ));
    }

    @GetMapping("/api/admin/loan-accounts/{id}/repayments")
    public LoanRepaymentHistoryResponse getAdminHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getAdminHistory(id, authentication);
    }

    @GetMapping("/api/loan-accounts/{id}/repayments")
    public LoanRepaymentHistoryResponse getCustomerHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getCustomerHistory(id, authentication);
    }
}
