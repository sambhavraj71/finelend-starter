
package com.finlend.dto;

import java.math.BigDecimal;

public record MonthlyCollectionResponse(
        String month,
        long totalPayments,
        BigDecimal totalCollected,
        BigDecimal principalCollected,
        BigDecimal interestCollected
) {
}
