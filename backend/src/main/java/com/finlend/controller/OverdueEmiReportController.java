
package com.finlend.controller;

import com.finlend.dto.OverdueEmiResponse;
import com.finlend.service.OverdueEmiReportService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
public class OverdueEmiReportController {

    private final OverdueEmiReportService overdueEmiReportService;

    public OverdueEmiReportController(
            OverdueEmiReportService overdueEmiReportService) {
        this.overdueEmiReportService = overdueEmiReportService;
    }

    @GetMapping("/overdue-emis")
    public List<OverdueEmiResponse> getOverdueEmis() {
        return overdueEmiReportService.getOverdueEmis();
    }
}
