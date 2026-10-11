
package com.finlend.service;

import com.finlend.dto.FinancialSummaryResponse;
import com.finlend.dto.MonthlyCollectionResponse;
import com.finlend.dto.MonthlyDisbursementResponse;

import com.finlend.entity.EmiPayment;
import com.finlend.entity.LoanAccountStatus;

import com.finlend.repository.EmiPaymentRepository;
import com.finlend.repository.LoanAccountRepository;
import com.finlend.repository.LoanDisbursementRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinancialReportService {

    private final LoanDisbursementRepository disbursementRepository;
    private final EmiPaymentRepository paymentRepository;
    private final LoanAccountRepository loanAccountRepository;

    public FinancialReportService(
            LoanDisbursementRepository disbursementRepository,
            EmiPaymentRepository paymentRepository,
            LoanAccountRepository loanAccountRepository
    ) {
        this.disbursementRepository = disbursementRepository;
        this.paymentRepository = paymentRepository;
        this.loanAccountRepository = loanAccountRepository;
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse getFinancialSummary() {

        BigDecimal totalDisbursed = zeroIfNull(
                disbursementRepository.sumTotalDisbursed()
        );

        BigDecimal totalCollected = zeroIfNull(
                paymentRepository.sumTotalCollected()
        );

        BigDecimal principalCollected = zeroIfNull(
                paymentRepository.sumTotalPrincipalCollected()
        );

        BigDecimal interestCollected = zeroIfNull(
                paymentRepository.sumTotalInterestCollected()
        );

        BigDecimal outstandingPrincipal = zeroIfNull(
                loanAccountRepository.sumOutstandingPrincipalByStatus(
                        LoanAccountStatus.ACTIVE
                )
        );

        BigDecimal collectionPercentage = BigDecimal.ZERO;

        if (totalDisbursed.compareTo(BigDecimal.ZERO) > 0) {
            collectionPercentage = totalCollected
                    .multiply(BigDecimal.valueOf(100))
                    .divide(
                            totalDisbursed,
                            2,
                            RoundingMode.HALF_UP
                    );
        }

        return new FinancialSummaryResponse(
                totalDisbursed,
                totalCollected,
                principalCollected,
                interestCollected,
                outstandingPrincipal,
                collectionPercentage
        );
    }

    @Transactional(readOnly = true)
    public List<MonthlyDisbursementResponse> getMonthlyDisbursements() {

        return disbursementRepository
                .getMonthlyDisbursementReport()
                .stream()
                .map(row -> new MonthlyDisbursementResponse(
                        row[0].toString(),
                        ((Number) row[1]).longValue(),
                        new BigDecimal(row[2].toString())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyCollectionResponse> getMonthlyCollections() {

        List<EmiPayment> payments =
                paymentRepository.findAllWithInstallmentsOrderByPaidAtDesc();

        Map<YearMonth, MonthlyCollectionAccumulator> monthlyData =
                new LinkedHashMap<>();

        for (EmiPayment payment : payments) {

            YearMonth month = YearMonth.from(payment.getPaidAt());

            MonthlyCollectionAccumulator accumulator =
                    monthlyData.computeIfAbsent(
                            month,
                            key -> new MonthlyCollectionAccumulator()
                    );

            accumulator.totalPayments++;

            accumulator.totalCollected = accumulator.totalCollected.add(
                    payment.getAmount()
            );

            accumulator.principalCollected =
                    accumulator.principalCollected.add(
                            payment.getInstallment().getPrincipalComponent()
                    );

            accumulator.interestCollected =
                    accumulator.interestCollected.add(
                            payment.getInstallment().getInterestComponent()
                    );
        }

        return monthlyData.entrySet()
                .stream()
                .sorted(Map.Entry.<YearMonth, MonthlyCollectionAccumulator>
                        comparingByKey().reversed())
                .map(entry -> new MonthlyCollectionResponse(
                        entry.getKey().toString(),
                        entry.getValue().totalPayments,
                        entry.getValue().totalCollected,
                        entry.getValue().principalCollected,
                        entry.getValue().interestCollected
                ))
                .toList();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static class MonthlyCollectionAccumulator {

        private long totalPayments = 0;

        private BigDecimal totalCollected = BigDecimal.ZERO;

        private BigDecimal principalCollected = BigDecimal.ZERO;

        private BigDecimal interestCollected = BigDecimal.ZERO;
    }
}
