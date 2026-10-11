
package com.finlend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record LoanProductRequest(

    @NotBlank
    @Size(max = 40)
    String code,

    @NotBlank
    @Size(max = 100)
    String name,

    @Size(max = 500)
    String description,

    @NotNull
    @DecimalMin("1.00")
    BigDecimal minAmount,

    @NotNull
    @DecimalMin("1.00")
    BigDecimal maxAmount,

    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("100.00")
    BigDecimal annualInterestRate,

    @NotNull
    @Min(1)
    Integer minTenureMonths,

    @NotNull
    @Min(1)
    Integer maxTenureMonths

) {}
