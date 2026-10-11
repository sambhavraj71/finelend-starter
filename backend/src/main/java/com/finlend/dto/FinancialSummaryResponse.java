
package com.finlend.dto;

import java.math.BigDecimal;

public record FinancialSummaryResponse(
        BigDecimal totalDisbursed,
        BigDecimal totalCollected,
        BigDecimal totalPrincipalCollected,
        BigDecimal totalInterestCollected,
        BigDecimal totalOutstandingPrincipal,
        BigDecimal collectionPercentage
) {
}
