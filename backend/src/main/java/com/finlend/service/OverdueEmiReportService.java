
package com.finlend.service;

import com.finlend.dto.OverdueEmiResponse;
import com.finlend.entity.EmiPaymentStatus;
import com.finlend.repository.EmiInstallmentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class OverdueEmiReportService {

    private final EmiInstallmentRepository installmentRepository;
    private final Clock clock;

    public OverdueEmiReportService(
            EmiInstallmentRepository installmentRepository) {
        this.installmentRepository = installmentRepository;
        this.clock = Clock.systemDefaultZone();
    }

    @Transactional(readOnly = true)
    public List<OverdueEmiResponse> getOverdueEmis() {

        LocalDate today = LocalDate.now(clock);

        return installmentRepository
                .findOverdueInstallments(
                        List.of(
                                EmiPaymentStatus.PENDING,
                                EmiPaymentStatus.OVERDUE),
                        today)
                .stream()
                .map(installment -> new OverdueEmiResponse(
                        installment.getLoanAccount().getId(),
                        installment.getLoanAccount().getAccountNumber(),
                        installment.getInstallmentNumber(),
                        installment.getDueDate(),
                        ChronoUnit.DAYS.between(
                                installment.getDueDate(),
                                today),
                        installment.getEmiAmount(),
                        installment.getPaymentStatus()))
                .toList();
    }
}
