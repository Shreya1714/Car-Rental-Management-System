package com.rental;

import com.rental.model.Car;
import com.rental.model.CarType;
import com.rental.model.Role;
import com.rental.model.User;
import com.rental.repository.CarRepository;
import com.rental.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@SpringBootApplication
public class CarRentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarRentalApplication.class, args);
    }

    /** Seeds a default admin account on first run so there's always a way in. */
    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository, PasswordEncoder encoder) {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                User admin = User.builder()
                        .username("admin")
                        .password(encoder.encode("Admin@123"))
                        .email("admin@driveeasy.local")
                        .fullName("System Administrator")
                        .role(Role.ADMIN)
                        .enabled(true)
                        .build();
                userRepository.save(admin);
                System.out.println(">>> Seeded default admin user: admin / Admin@123 (change this password!)");
            }
        };
    }

    /**
     * Seeds a demo fleet on first run. Done in code (not data.sql) so it always
     * runs after Hibernate has created the schema, regardless of startup timing.
     */
    @Bean
    public CommandLineRunner seedCars(CarRepository carRepository) {
        return args -> {
            if (carRepository.count() > 0) {
                return;
            }
            List<Car> demoCars = List.of(
                    Car.builder().type(CarType.SEDAN).model("Honda City").registrationNumber("MH12AB1234")
                            .seats(5).dailyRate(new BigDecimal("2500.00")).fuelType("Petrol").transmission("Automatic")
                            .imageUrl("https://images.unsplash.com/photo-1550355191-aa8a80b41353?w=600").active(true).build(),
                    Car.builder().type(CarType.SEDAN).model("Hyundai Verna").registrationNumber("MH12AB1235")
                            .seats(5).dailyRate(new BigDecimal("2200.00")).fuelType("Diesel").transmission("Manual")
                            .imageUrl("https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600").active(true).build(),
                    Car.builder().type(CarType.SUV).model("Toyota Fortuner").registrationNumber("MH12CD5678")
                            .seats(7).dailyRate(new BigDecimal("5500.00")).fuelType("Diesel").transmission("Automatic")
                            .imageUrl("https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600").active(true).build(),
                    Car.builder().type(CarType.SUV).model("Mahindra XUV700").registrationNumber("MH12CD5679")
                            .seats(7).dailyRate(new BigDecimal("4200.00")).fuelType("Diesel").transmission("Automatic")
                            .imageUrl("https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600").active(true).build(),
                    Car.builder().type(CarType.SUV).model("Hyundai Creta").registrationNumber("MH12CD5680")
                            .seats(5).dailyRate(new BigDecimal("3200.00")).fuelType("Petrol").transmission("Manual")
                            .imageUrl("https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=600").active(true).build(),
                    Car.builder().type(CarType.TRAVELLER).model("Force Traveller 17-Seater").registrationNumber("MH12EF9012")
                            .seats(17).dailyRate(new BigDecimal("8500.00")).fuelType("Diesel").transmission("Manual")
                            .imageUrl("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600").active(true).build(),
                    Car.builder().type(CarType.TRAVELLER).model("Tempo Traveller 12-Seater").registrationNumber("MH12EF9013")
                            .seats(12).dailyRate(new BigDecimal("6500.00")).fuelType("Diesel").transmission("Manual")
                            .imageUrl("https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600").active(true).build()
            );
            carRepository.saveAll(demoCars);
            System.out.println(">>> Seeded " + demoCars.size() + " demo cars into the fleet.");
        };
    }
}

