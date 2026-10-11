
package com.finlend.dto;

import com.finlend.entity.EmiPaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OverdueEmiResponse(
        Long loanAccountId,
        String accountNumber,
        Integer installmentNumber,
        LocalDate dueDate,
        long daysOverdue,
        BigDecimal emiAmount,
        EmiPaymentStatus paymentStatus) {
}
