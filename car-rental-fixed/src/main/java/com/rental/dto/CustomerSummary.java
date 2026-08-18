package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CustomerSummary {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private LocalDateTime joinedAt;
    private long totalBookings;
    private BigDecimal totalSpent;
}
