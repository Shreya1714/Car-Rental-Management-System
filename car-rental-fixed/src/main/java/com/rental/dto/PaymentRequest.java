package com.rental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotNull
    private Long bookingId;

    @NotBlank
    @Pattern(regexp = "(?i)CARD|UPI|NETBANKING",
             message = "method must be one of: CARD, UPI, NETBANKING")
    private String method;
}
