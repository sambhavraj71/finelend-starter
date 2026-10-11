
package com.finlend.controller;

import com.finlend.dto.CustomerDashboardResponse;
import com.finlend.service.CustomerDashboardService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/dashboard")
public class CustomerDashboardController {

    private final CustomerDashboardService dashboardService;

    public CustomerDashboardController(
            CustomerDashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public CustomerDashboardResponse getSummary(
            Authentication authentication
    ) {
        return dashboardService.getSummary(authentication);
    }
}
