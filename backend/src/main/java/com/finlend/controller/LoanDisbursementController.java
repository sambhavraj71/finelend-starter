
package com.finlend.controller;

import com.finlend.dto.DisbursementRequest;
import com.finlend.dto.DisbursementResponse;
import com.finlend.service.LoanDisbursementService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/disbursements")
public class LoanDisbursementController {

    private final LoanDisbursementService service;

    public LoanDisbursementController(LoanDisbursementService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<DisbursementResponse> disburse(
            @Valid @RequestBody DisbursementRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.disburse(request, authentication));
    }

    @GetMapping
    public List<DisbursementResponse> getAll() {
        return service.getAllDisbursements();
    }

    @GetMapping("/{id}")
    public DisbursementResponse getById(@PathVariable Long id) {
        return service.getDisbursement(id);
    }
}
