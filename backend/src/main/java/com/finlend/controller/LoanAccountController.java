
package com.finlend.controller;

import com.finlend.dto.LoanAccountResponse;
import com.finlend.service.LoanDisbursementService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-accounts")
public class LoanAccountController {

    private final LoanDisbursementService service;

    public LoanAccountController(LoanDisbursementService service) {
        this.service = service;
    }

    @GetMapping("/my")
    public List<LoanAccountResponse> getMyAccounts(
            Authentication authentication
    ) {
        return service.getMyAccounts(authentication);
    }

    @GetMapping("/{id}")
    public LoanAccountResponse getMyAccountById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getMyAccountById(id, authentication);
    }
}
