
package com.finlend.dto;

import jakarta.validation.constraints.NotNull;

public record LoanProductStatusRequest(
    @NotNull Boolean active
) {}
