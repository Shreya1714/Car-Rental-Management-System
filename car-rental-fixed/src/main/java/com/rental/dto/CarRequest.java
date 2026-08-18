package com.rental.dto;

import com.rental.model.CarType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CarRequest {
    @NotNull
    private CarType type;
    @NotBlank
    private String model;
    @NotBlank
    private String registrationNumber;
    @Positive
    private Integer seats;
    @Positive
    private BigDecimal dailyRate;
    private String fuelType;
    private String transmission;
    private String imageUrl;
}
