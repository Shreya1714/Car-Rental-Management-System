package com.rental.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecommendationRequest {
    private Integer passengers;
    private BigDecimal budgetPerDay;
    private String tripType; // CITY, OUTSTATION, GROUP, LUGGAGE_HEAVY
}
