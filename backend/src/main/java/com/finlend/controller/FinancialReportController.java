
package com.finlend.controller;

import com.finlend.dto.FinancialSummaryResponse;
import com.finlend.dto.MonthlyCollectionResponse;
import com.finlend.dto.MonthlyDisbursementResponse;

import com.finlend.service.FinancialReportService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
public class FinancialReportController {

    private final FinancialReportService reportService;

    public FinancialReportController(
            FinancialReportService reportService
    ) {
        this.reportService = reportService;
    }

    @GetMapping("/financial-summary")
    public FinancialSummaryResponse getFinancialSummary() {
        return reportService.getFinancialSummary();
    }

    @GetMapping("/monthly-disbursements")
    public List<MonthlyDisbursementResponse> getMonthlyDisbursements() {
        return reportService.getMonthlyDisbursements();
    }

    @GetMapping("/monthly-collections")
    public List<MonthlyCollectionResponse> getMonthlyCollections() {
        return reportService.getMonthlyCollections();
    }
}
