
package com.finlend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoanDecisionRequest(

    @NotBlank
    @Size(max = 1000)
    String remarks

) {}
