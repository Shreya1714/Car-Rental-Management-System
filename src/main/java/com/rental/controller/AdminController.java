package com.rental.controller;

import com.rental.dto.CarRequest;
import com.rental.dto.CustomerSummary;
import com.rental.model.Booking;
import com.rental.model.Car;
import com.rental.model.Role;
import com.rental.model.User;
import com.rental.repository.BookingRepository;
import com.rental.repository.UserRepository;
import com.rental.service.CarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CarService carService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    // ---- 1. Add / Remove car ----

    @PostMapping("/cars")
    public ResponseEntity<Car> addCar(@Valid @RequestBody CarRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(carService.addCar(req));
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<Void> removeCar(@PathVariable Long id) {
        carService.removeCar(id);
        return ResponseEntity.noContent().build();
    }

    // ---- 2. Modify car details (rates etc.) ----

    @PutMapping("/cars/{id}")
    public ResponseEntity<Car> updateCar(@PathVariable Long id, @Valid @RequestBody CarRequest req) {
        return ResponseEntity.ok(carService.updateCarDetails(id, req));
    }

    @GetMapping("/cars")
    public ResponseEntity<List<Car>> listAllCars() {
        return ResponseEntity.ok(carService.getAllCars());
    }

    // ---- Admin visibility into all bookings (archive view) ----

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> allBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    // ---- 3. Customer directory (registered customers + booking activity) ----

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerSummary>> allCustomers() {
        List<Booking> allBookings = bookingRepository.findAll();

        Map<Long, List<Booking>> bookingsByCustomer = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getCustomer().getId()));

        List<CustomerSummary> customers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .map(u -> {
                    List<Booking> theirBookings = bookingsByCustomer.getOrDefault(u.getId(), List.of());
                    BigDecimal totalSpent = theirBookings.stream()
                            .map(Booking::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return CustomerSummary.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .phone(u.getPhone())
                            .joinedAt(u.getCreatedAt())
                            .totalBookings(theirBookings.size())
                            .totalSpent(totalSpent)
                            .build();
                })
                .sorted(Comparator.comparing(CustomerSummary::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        return ResponseEntity.ok(customers);
    }
}
