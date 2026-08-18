package com.rental.controller;

import com.rental.dto.BookingRequest;
import com.rental.dto.PaymentRequest;
import com.rental.model.Booking;
import com.rental.model.Payment;
import com.rental.service.BookingService;
import com.rental.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    // ---- 2. Book / Cancel a car ----

    @PostMapping("/bookings")
    public ResponseEntity<Booking> bookCar(Authentication auth, @Valid @RequestBody BookingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.bookCar(auth.getName(), req));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> cancelBooking(Authentication auth, @PathVariable Long id) {
        bookingService.cancelBooking(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> myBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getBookingsForCustomer(auth.getName()));
    }

    // ---- 3. Payment ----

    @PostMapping("/payments")
    public ResponseEntity<Payment> pay(Authentication auth, @Valid @RequestBody PaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.pay(auth.getName(), req));
    }
}
