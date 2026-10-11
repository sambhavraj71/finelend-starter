
package com.finlend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record LoanApplicationRequest(

    @NotNull
    Long loanProductId,

    @NotNull
    @DecimalMin("1.00")
    BigDecimal requestedAmount,

    @NotNull
    @Min(1)
    Integer tenureMonths,

    @NotNull
    @DecimalMin("1.00")
    BigDecimal monthlyIncome,

    @NotBlank
    @Size(max = 100)
    String employmentType

) {}
