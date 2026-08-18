package com.rental.service;

import com.rental.model.BookingStatus;
import com.rental.model.Car;
import com.rental.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Lightweight "AI-assisted" dynamic pricing: adjusts the base daily rate
 * using a demand signal (how many active bookings exist for this car's
 * type right now) and how far in advance / how long the trip is.
 * This is a transparent, explainable heuristic model rather than a black
 * box, which is intentional for a rental-pricing feature.
 */
@Service
@RequiredArgsConstructor
public class PricingService {

    private final BookingRepository bookingRepository;

    public BigDecimal dynamicDailyRate(Car car, LocalDate startDate, LocalDate endDate) {
        BigDecimal base = car.getDailyRate();

        long activeDemand = bookingRepository.countByCar_TypeAndStatusIn(
                car.getType(), List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));

        // Demand surge: +2% per active booking of the same car type, capped at +20%.
        BigDecimal demandMultiplier = BigDecimal.ONE.add(
                BigDecimal.valueOf(Math.min(activeDemand * 2, 20)).divide(BigDecimal.valueOf(100)));

        // Long-trip discount: 5% off for rentals of 7+ days, 10% off for 14+ days.
        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        BigDecimal lengthDiscount = BigDecimal.ONE;
        if (days >= 14) {
            lengthDiscount = new BigDecimal("0.90");
        } else if (days >= 7) {
            lengthDiscount = new BigDecimal("0.95");
        }

        return base.multiply(demandMultiplier).multiply(lengthDiscount)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
