# DriveEasy — Car Rental Service Management System

A full-stack Java Spring Boot application for managing a car rental
business, with **Admin** and **Customer** roles, day-wise availability,
booking + simulated payments, persistent (archived) data, and two AI
features: a rule-based recommendation engine and a Claude-powered chat
assistant.

> **Note on this delivery:** this was built in a sandbox that cannot reach
> Maven Central, so I was not able to run `mvn package` here to compile-test
> it. The code follows standard, well-worn Spring Boot patterns throughout —
> but please run a build on your own machine (steps below) before treating
> it as final, and let me know if any compiler error turns up so I can fix
> it immediately.

---

## 1. Features

### Admin
1. **Add / Remove cars** — remove is a soft-delete so booking history for
   that car is preserved (the "archive").
2. **Modify car details** (model, seats, rates, fuel, transmission, image).
3. View the full fleet and every booking ever made (admin bookings table).

### Customer
1. **Browse available cars, day-wise** — pick a start/end date and only
   cars with no overlapping active booking in that window are shown.
2. **Book / Cancel a car.**
3. **Payment** — a simulated gateway (CARD / UPI / NETBANKING) that
   confirms the booking on success and issues a transaction ID.
4. **AI recommendations** — tell it passenger count, budget/day and trip
   type; it scores the live fleet and explains each pick in plain English.
5. **AI chat assistant** — a floating chat widget answers natural-language
   questions ("cheapest SUV?", "car for 6 people going outstation?") using
   the live inventory as context.

### Data archiving
All data (users, cars, bookings, payments) is stored in a **file-based H2
database** (`./data/carrentaldb.mv.db`), so it survives restarts. Cars are
soft-deleted (`active=false`) rather than hard-deleted, so booking/payment
history is never lost — that's the "archive."

### AI capabilities (the two features are independent and both work out of the box)
- **`PricingService`** — transparent, explainable dynamic pricing: rates
  flex with live demand for that car type and give long-rental discounts.
- **`RecommendationService`** — rule-based scoring engine, zero external
  dependencies, always available.
- **`AiChatService`** — calls the real Anthropic Claude API
  (`api.anthropic.com`) if you set an `ANTHROPIC_API_KEY`. If the key is
  absent or the call fails for any reason, it automatically falls back to a
  deterministic keyword-based responder, so the whole app remains fully
  functional with **zero required external dependencies**.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Backend | Java 17, Spring Boot 3.3 (Web, Data JPA, Security, Validation, WebFlux client) |
| Auth | Stateless JWT (jjwt) |
| Database | H2, file-mode (swap `application.properties` for Postgres/MySQL in production) |
| Frontend | Vanilla JS SPA + Bootstrap 5 (no build step required) |
| AI | Rule-based pricing/recommendation engine + optional live Claude API call |
| Packaging | Maven, Docker, docker-compose |

---

## 3. Project layout

```
car-rental-service/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
└── src/main/
    ├── java/com/rental/
    │   ├── CarRentalApplication.java   (seeds a default admin user on first run)
    │   ├── model/                      (User, Car, Booking, Payment, enums)
    │   ├── repository/                 (Spring Data JPA repositories)
    │   ├── service/                    (business logic incl. AI services)
    │   ├── controller/                 (REST controllers)
    │   ├── security/                   (JWT filter + service)
    │   ├── config/                     (Spring Security config)
    │   ├── dto/                        (request/response payloads)
    │   └── exception/                  (global error handling)
    └── resources/
        ├── application.properties
        └── static/                     (the SPA: index.html, css/, js/)
```

---

## 4. Running it locally

**Prerequisites:** JDK 17+, Maven 3.9+ (Maven Central access required to
download dependencies the first time).

```bash
cd car-rental-service
mvn spring-boot:run
```

Then open **http://localhost:8080**.

- A default admin account is seeded automatically on first boot:
  **`admin` / `Admin@123`** — change this password immediately in a real
  deployment (see §6).
- Customers self-register from the "Register" tab on the login screen.
- 7 demo cars (SUV/Sedan/Traveller, multiple models each) are seeded in code
  on first boot, after the database schema is created — so there's no
  startup-ordering risk.

To enable the live Claude-powered assistant, set an environment variable
before starting:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
mvn spring-boot:run
```

Without it, the assistant still works using its built-in fallback logic.

---

## 5. Running with Docker (recommended for "deployable")

```bash
cd car-rental-service
docker compose up --build
```

This builds the jar inside a Maven container, then runs it in a slim JRE
image, with the H2 data folder mounted as a named volume so your data
survives container restarts. Visit **http://localhost:8080**.

To pass your Claude API key: `ANTHROPIC_API_KEY=sk-ant-... docker compose up --build`.

### Deploying to a cloud host
The Docker image is portable to any container host:
- **Render / Railway / Fly.io** — point them at this repo, they'll build
  from the `Dockerfile` automatically. Set `ANTHROPIC_API_KEY` as an env var
  in their dashboard if you want live AI chat.
- For production, swap H2 for a managed Postgres/MySQL instance by changing
  the 5 `spring.datasource.*` lines in `application.properties` and adding
  the matching JDBC driver dependency to `pom.xml`.

---

## 6. Before treating this as production-ready

- Change `app.jwt.secret` in `application.properties` to a long random
  value, and load it from an environment variable instead of committing it.
- Change/remove the default `admin/Admin@123` account.
- Swap H2 for Postgres/MySQL.
- The payment flow is **simulated** — no real card/bank data is collected
  or processed. Wire in Razorpay/Stripe in `PaymentService` for real
  transactions.

---

## 7. REST API reference

All authenticated requests need `Authorization: Bearer <token>`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create a customer account |
| POST | `/api/auth/login` | public | Get a JWT |
| GET | `/api/cars/available?startDate=&endDate=` | public | Day-wise available cars |
| POST | `/api/admin/cars` | ADMIN | Add a car |
| PUT | `/api/admin/cars/{id}` | ADMIN | Modify car details/rates |
| DELETE | `/api/admin/cars/{id}` | ADMIN | Remove (soft-delete) a car |
| GET | `/api/admin/cars` | ADMIN | List full fleet |
| GET | `/api/admin/bookings` | ADMIN | List every booking (archive) |
| POST | `/api/customer/bookings` | CUSTOMER | Book a car |
| DELETE | `/api/customer/bookings/{id}` | CUSTOMER | Cancel own booking |
| GET | `/api/customer/bookings` | CUSTOMER | My bookings |
| POST | `/api/customer/payments` | CUSTOMER | Pay for a PENDING booking |
| POST | `/api/ai/recommend` | any authenticated | AI shortlist of 3 cars |
| POST | `/api/ai/chat` | any authenticated | AI assistant chat |

An H2 web console is available at `/h2-console` (JDBC URL
`jdbc:h2:file:./data/carrentaldb`) for inspecting the archived data directly.

---

## 8. What I couldn't verify here

I wrote and reviewed every file by hand for correctness, but since this
sandbox has no route to Maven Central, I could not run `mvn compile` /
`mvn test` to catch, e.g., a typo'd import. Please run `mvn clean package`
on your machine as the first step — if anything fails to compile, paste me
the error and I'll fix it right away.
