package com.rental.service;

import com.rental.dto.CarRequest;
import com.rental.exception.ApiException;
import com.rental.model.Booking;
import com.rental.model.Car;
import com.rental.repository.BookingRepository;
import com.rental.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Car addCar(CarRequest req) {
        if (carRepository.existsByRegistrationNumber(req.getRegistrationNumber())) {
            throw new ApiException("A car with this registration number already exists", HttpStatus.CONFLICT);
        }
        Car car = Car.builder()
                .type(req.getType())
                .model(req.getModel())
                .registrationNumber(req.getRegistrationNumber())
                .seats(req.getSeats())
                .dailyRate(req.getDailyRate())
                .fuelType(req.getFuelType())
                .transmission(req.getTransmission())
                .imageUrl(req.getImageUrl())
                .active(true)
                .build();
        return carRepository.save(car);
    }

    @Transactional
    public void removeCar(Long carId) {
        Car car = getCarOrThrow(carId);
        // Soft delete: keeps booking/payment history intact for archiving.
        car.setActive(false);
        car.setUpdatedAt(LocalDateTime.now());
        carRepository.save(car);
    }

    @Transactional
    public Car updateCarDetails(Long carId, CarRequest req) {
        Car car = getCarOrThrow(carId);
        car.setModel(req.getModel());
        car.setSeats(req.getSeats());
        car.setDailyRate(req.getDailyRate());
        car.setFuelType(req.getFuelType());
        car.setTransmission(req.getTransmission());
        car.setImageUrl(req.getImageUrl());
        car.setType(req.getType());
        car.setUpdatedAt(LocalDateTime.now());
        return carRepository.save(car);
    }

    public List<Car> getAllCars() {
        return carRepository.findByActiveTrue();
    }

    public Car getCarOrThrow(Long carId) {
        return carRepository.findById(carId)
                .filter(Car::isActive)
                .orElseThrow(() -> new ApiException("Car not found", HttpStatus.NOT_FOUND));
    }

    /** Day-wise availability: cars with no overlapping active booking in [startDate, endDate]. */
    public List<Car> getAvailableCars(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new ApiException("endDate cannot be before startDate", HttpStatus.BAD_REQUEST);
        }
        List<Car> allCars = carRepository.findByActiveTrue();
        List<Booking> activeInRange = bookingRepository.findAllActiveInRange(startDate, endDate);
        Set<Long> bookedCarIds = activeInRange.stream()
                .map(b -> b.getCar().getId())
                .collect(Collectors.toSet());

        return allCars.stream()
                .filter(c -> !bookedCarIds.contains(c.getId()))
                .collect(Collectors.toList());
    }
}
