package com.rental.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull
    private Long carId;

    @NotNull
    @FutureOrPresent(message = "startDate must be today or in the future")
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
