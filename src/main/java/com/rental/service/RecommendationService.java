package com.rental.service;

import com.rental.dto.RecommendationRequest;
import com.rental.model.Car;
import com.rental.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Rule-based "AI recommendation engine": scores every available car against
 * the customer's stated needs (party size, budget, trip type) and returns
 * a ranked shortlist with a plain-language reason for each pick. Works with
 * zero external dependencies so the app is fully functional offline/without
 * an API key, in addition to the Claude-backed chat assistant.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final CarRepository carRepository;

    public List<Recommendation> recommend(RecommendationRequest req) {
        List<Car> cars = carRepository.findByActiveTrue();

        return cars.stream()
                .map(car -> new Recommendation(car, score(car, req), reason(car, req)))
                .sorted(Comparator.comparingDouble(Recommendation::score).reversed())
                .limit(3)
                .collect(Collectors.toList());
    }

    private double score(Car car, RecommendationRequest req) {
        double score = 50;

        if (req.getPassengers() != null) {
            if (car.getSeats() >= req.getPassengers()) {
                // Reward a close-but-sufficient seat match over an oversized car.
                score += 30 - Math.min(20, (car.getSeats() - req.getPassengers()) * 3);
            } else {
                score -= 40; // can't fit the party at all
            }
        }

        if (req.getBudgetPerDay() != null) {
            BigDecimal rate = car.getDailyRate();
            if (rate.compareTo(req.getBudgetPerDay()) <= 0) {
                score += 20;
            } else {
                double overBy = rate.subtract(req.getBudgetPerDay())
                        .divide(req.getBudgetPerDay(), 4, java.math.RoundingMode.HALF_UP)
                        .doubleValue();
                score -= Math.min(40, overBy * 100);
            }
        }

        if (req.getTripType() != null) {
            switch (req.getTripType().toUpperCase()) {
                case "OUTSTATION" -> {
                    if (car.getType().name().equals("SUV")) score += 15;
                }
                case "GROUP" -> {
                    if (car.getType().name().equals("TRAVELLER")) score += 20;
                }
                case "CITY" -> {
                    if (car.getType().name().equals("SEDAN")) score += 15;
                }
                case "LUGGAGE_HEAVY" -> {
                    if (!car.getType().name().equals("SEDAN")) score += 10;
                }
                default -> {}
            }
        }

        return score;
    }

    private String reason(Car car, RecommendationRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append(car.getModel()).append(" (").append(car.getType()).append(") ");
        if (req.getPassengers() != null) {
            sb.append("seats ").append(car.getSeats())
              .append(car.getSeats() >= req.getPassengers() ? " — fits your group. " : " — too small for your group. ");
        }
        if (req.getBudgetPerDay() != null) {
            sb.append("Rs.").append(car.getDailyRate()).append("/day ");
            sb.append(car.getDailyRate().compareTo(req.getBudgetPerDay()) <= 0 ? "fits your budget. " : "is above your stated budget. ");
        }
        if (req.getTripType() != null) {
            sb.append("Well suited for ").append(req.getTripType().toLowerCase()).append(" trips.");
        }
        return sb.toString().trim();
    }

    public record Recommendation(Car car, double score, String reason) {}
}
