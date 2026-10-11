
package com.finlend.controller;

import com.finlend.dto.*;
import com.finlend.service.LoanApplicationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-applications")
public class LoanApplicationController {

    private final LoanApplicationService service;

    public LoanApplicationController(LoanApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LoanApplicationResponse> apply(
            @Valid @RequestBody LoanApplicationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.apply(request, authentication));
    }

    @GetMapping("/my")
    public List<LoanApplicationResponse> getMyApplications(
            Authentication authentication
    ) {
        return service.getMyApplications(authentication);
    }

    @GetMapping("/admin/all")
    public List<LoanApplicationResponse> getAllApplications() {
        return service.getAllApplications();
    }

    @GetMapping("/{id}")
    public LoanApplicationResponse getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getById(id, authentication);
    }
}
