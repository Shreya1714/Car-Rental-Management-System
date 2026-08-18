package com.rental.repository;

import com.rental.model.Car;
import com.rental.model.CarType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CarRepository extends JpaRepository<Car, Long> {
    List<Car> findByActiveTrue();
    List<Car> findByTypeAndActiveTrue(CarType type);
    boolean existsByRegistrationNumber(String registrationNumber);
}
