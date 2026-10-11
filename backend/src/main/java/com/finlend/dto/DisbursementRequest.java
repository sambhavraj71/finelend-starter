
package com.finlend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DisbursementRequest(

    @NotNull
    @Positive
    Long loanApplicationId

) {}
