package com.rental.service;

import com.rental.dto.PaymentRequest;
import com.rental.exception.ApiException;
import com.rental.model.*;
import com.rental.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Simulated payment gateway (no real card/bank data handled). Marks the
 * booking CONFIRMED on success — this is where a real integration
 * (Razorpay/Stripe) would be plugged in.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;

    @Transactional
    public Payment pay(String username, PaymentRequest req) {
        Booking booking = bookingService.getBookingOrThrow(req.getBookingId());

        if (!booking.getCustomer().getUsername().equals(username)) {
            throw new ApiException("You cannot pay for another customer's booking", HttpStatus.FORBIDDEN);
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ApiException("Booking is not awaiting payment", HttpStatus.BAD_REQUEST);
        }
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new ApiException("This booking has already been paid for", HttpStatus.CONFLICT);
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getTotalAmount())
                .method(req.getMethod().toUpperCase())
                .transactionId("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .status(PaymentStatus.SUCCESS) // simulated gateway always succeeds here
                .build();

        Payment saved = paymentRepository.save(payment);
        bookingService.markConfirmed(booking);
        return saved;
    }
}
