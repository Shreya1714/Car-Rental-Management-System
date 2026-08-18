package com.rental.service;

import com.rental.dto.BookingRequest;
import com.rental.exception.ApiException;
import com.rental.model.*;
import com.rental.repository.BookingRepository;
import com.rental.repository.CarRepository;
import com.rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;

    @Transactional
    public Booking bookCar(String username, BookingRequest req) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        Car car = carRepository.findById(req.getCarId())
                .filter(Car::isActive)
                .orElseThrow(() -> new ApiException("Car not found", HttpStatus.NOT_FOUND));

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new ApiException("endDate cannot be before startDate", HttpStatus.BAD_REQUEST);
        }

        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                car.getId(), req.getStartDate(), req.getEndDate());
        if (!overlaps.isEmpty()) {
            throw new ApiException("Car is not available for the selected dates", HttpStatus.CONFLICT);
        }

        long days = ChronoUnit.DAYS.between(req.getStartDate(), req.getEndDate()) + 1;
        BigDecimal dailyRate = pricingService.dynamicDailyRate(car, req.getStartDate(), req.getEndDate());
        BigDecimal total = dailyRate.multiply(BigDecimal.valueOf(days));

        Booking booking = Booking.builder()
                .car(car)
                .customer(customer)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .totalAmount(total)
                .status(BookingStatus.PENDING) // becomes CONFIRMED after payment
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public void cancelBooking(String username, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND));

        if (!booking.getCustomer().getUsername().equals(username)) {
            throw new ApiException("You cannot cancel another customer's booking", HttpStatus.FORBIDDEN);
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ApiException("Booking already cancelled", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForCustomer(String username) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        return bookingRepository.findByCustomerId(customer.getId());
    }

    public Booking getBookingOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void markConfirmed(Booking booking) {
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
    }
}
