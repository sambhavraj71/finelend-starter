
package com.finlend.dto;

import java.math.BigDecimal;

public record MonthlyDisbursementResponse(
        String month,
        long totalLoans,
        BigDecimal totalAmount
) {
}
