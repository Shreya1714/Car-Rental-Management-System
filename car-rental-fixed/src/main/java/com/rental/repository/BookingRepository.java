package com.rental.repository;

import com.rental.model.Booking;
import com.rental.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerId(Long customerId);

    List<Booking> findByCarId(Long carId);

    // Overlapping-date bookings for a given car that are still "active"
    // (PENDING or CONFIRMED) - used to compute day-wise availability.
    @Query("""
        SELECT b FROM Booking b
        WHERE b.car.id = :carId
          AND b.status IN ('PENDING', 'CONFIRMED')
          AND b.startDate <= :endDate
          AND b.endDate >= :startDate
        """)
    List<Booking> findOverlappingBookings(@Param("carId") Long carId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status IN ('PENDING','CONFIRMED')
          AND b.startDate <= :endDate
          AND b.endDate >= :startDate
        """)
    List<Booking> findAllActiveInRange(@Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate);

    long countByCar_TypeAndStatusIn(com.rental.model.CarType type, List<BookingStatus> statuses);
}
