
package com.finlend.controller;

import com.finlend.dto.EmiScheduleResponse;
import com.finlend.service.EmiScheduleService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class EmiScheduleController {

    private final EmiScheduleService service;

    public EmiScheduleController(EmiScheduleService service) {
        this.service = service;
    }

    @PostMapping(
        "/api/admin/loan-accounts/{id}/generate-schedule"
    )
    public ResponseEntity<EmiScheduleResponse> generate(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.generateSchedule(id, authentication));
    }

    @GetMapping("/api/admin/loan-accounts/{id}/schedule")
    public EmiScheduleResponse getAdminSchedule(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getAdminSchedule(id, authentication);
    }

    @GetMapping("/api/loan-accounts/{id}/schedule")
    public EmiScheduleResponse getCustomerSchedule(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getCustomerSchedule(id, authentication);
    }
}
