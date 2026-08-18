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
    │   ├── controller/                 (REST controllers + PageController)
    │   ├── security/                   (JWT filter + service)
    │   ├── config/                     (Spring Security config)
    │   ├── dto/                        (request/response payloads)
    │   └── exception/                  (global error handling)
    └── resources/
        ├── application.properties
        └── static/                     (the frontend: one HTML file per page)
            ├── login.html              (also served at "/")
            ├── register.html
            ├── cars.html               (customer: search + book)
            ├── bookings.html           (customer: reservations + payment)
            ├── assistant.html          (customer: AI recommendations)
            ├── support.html            (customer: contact + FAQ)
            ├── settings.html           (both roles: account + password)
            ├── admin-dashboard.html
            ├── admin-fleet.html
            ├── admin-bookings.html
            ├── admin-customers.html
            ├── css/style.css
            └── js/
                ├── api.js              (Auth + Api: all fetch calls)
                ├── common.js           (guard, navbar, footer, toasts, chat widget)
                ├── google-signin.js    (shared by login + register)
                └── pages/              (one script per page)
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
| GET | `/api/auth/config` | public | Whether Google sign-in is enabled + client id |
| POST | `/api/auth/google` | public | Exchange a Google ID token for a JWT |
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

## 8. Frontend structure

The UI is a **multi-page application**: every screen is its own HTML file with
its own URL. There is no client-side router and no view-swapping — navigating
between screens is an ordinary browser page load.

The root URL `/` is the sign-in page. There is no public landing page: an
anonymous visitor has nothing to do but log in, and an already-signed-in user is
sent straight to their own start page (`cars.html` for customers,
`admin-dashboard.html` for admins) by `login.js`'s `guestOnly` guard.

**Shared code, not shared pages.** Repeating the navbar in twelve files would
mean twelve places to edit, so `common.js` injects the shared chrome (navbar,
footer, toast host, AI chat widget) into the `#siteNav` / `#siteFooter`
placeholders each page provides. Everything unique to a page — its forms,
headings and layout — is real static HTML in that page's own file.

**Every page bootstraps the same way.** The first line of each page script is:

```js
if (initPage({ page: 'cars', requires: 'CUSTOMER', chat: true })) { ... }
```

`initPage` checks access, paints the chrome, highlights the right nav item and
returns `false` if a redirect is under way, so the page body never runs against
a session that isn't there.

| Option | Meaning |
|---|---|
| `page` | Which nav item to highlight |
| `requires` | `'CUSTOMER'`, `'ADMIN'`, `'ANY'`, or omitted for a public page |
| `chat` | Mount the AI chat bubble |
| `guestOnly` | Bounce signed-in users away (login / register) |

**Clean URLs.** `PageController` forwards extension-less paths to the matching
file, so `/cars` and `/cars.html` both work. Admin URLs are deliberately flat
(`/admin-fleet`, not `/admin/fleet`) — a nested path would make the browser
resolve each page's relative `js/…` and `css/…` links against `/admin/`.

**Cross-page state.** Two things need to survive a navigation:

- `toastAfterRedirect(msg)` stashes a toast in `sessionStorage` so an action on
  one page can be confirmed on the next (booking happens on `cars.html`, the
  confirmation appears on `bookings.html`).
- The search dates on `cars.html` are kept in `sessionStorage`, so returning
  from another page doesn't reset the search.

### A note on page-level access control

`initPage` guards pages **in the browser only**. Someone can open
`admin-fleet.html` directly and see an empty shell — but every `/api/**` call it
makes is still checked by Spring Security, so no data is exposed. Real
server-side page guarding would require session cookies instead of a
localStorage JWT, which is a larger change than this rewrite.

---

## 9. Google Sign-In setup

The app runs fine without this — if no client ID is configured the Google button
simply doesn't render and username/password login works as before.

**1. Create an OAuth client**

1. Go to <https://console.cloud.google.com> → create (or pick) a project.
2. **APIs & Services → OAuth consent screen** → configure it (External is fine;
   while it's in *Testing* mode, add your own Google account under *Test users*).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized JavaScript origins**, add every origin you open the app on:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
   - your deployed URL, e.g. `https://driveeasy.example.com`

   This must be an *origin* — scheme + host + port, no path, no trailing slash.
   You do **not** need a redirect URI: this flow never leaves the page.
6. Copy the **Client ID** (looks like `1234567890-abc123.apps.googleusercontent.com`).
   The client secret is not used by this flow.

**2. Give it to the app**

Either set an environment variable:

```bash
export GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
mvn spring-boot:run
```

or edit `src/main/resources/application.properties`:

```properties
app.oauth.google.client-id=1234567890-abc123.apps.googleusercontent.com
```

For Docker, add it under `environment:` in `docker-compose.yml`.

**3. How it works**

```
Browser  --(Google Identity Services popup)-->  Google
Browser  <--------- ID token (JWT) -----------  Google
Browser  --- POST /api/auth/google {credential} --->  Spring Boot
                       GoogleIdTokenVerifier checks
                       signature + issuer + audience + expiry
                       against Google's cached public keys
Browser  <--------- app JWT + username + role ------  Spring Boot
```

The rest of the app is untouched — a Google user carries the same
`Authorization: Bearer <jwt>` header as a password user.

**Account rules**

- First Google sign-in creates a `CUSTOMER` account. The username is derived
  from the email local part (`jane.doe@gmail.com` → `jane.doe`, with a numeric
  suffix on collision).
- If the Google email already matches an existing account, the two are **linked**
  rather than duplicated — the user keeps their bookings, role and password login.
- Only **verified** Google emails are accepted, so nobody can hijack a local
  account by claiming its address.
- Google-created accounts have no usable password, so `PUT /api/auth/password`
  returns 400 for them.

**Troubleshooting**

| Symptom | Cause |
|---|---|
| Button doesn't appear | Client ID not set — check `GET /api/auth/config` |
| `origin is not allowed` in console | Origin missing from *Authorized JavaScript origins*, or you're on a different port |
| 401 `Invalid or expired Google sign-in token` | Client ID in the app doesn't match the one that issued the token |
| 403 `access_denied` popup | Consent screen is in Testing and your account isn't a test user |

---

## 10. What was and wasn't verified

**Tested in a real browser.** The multi-page frontend was driven end-to-end in
headless Chromium against a mock API: access guards on all nine protected pages,
the full customer journey (login → filter → book → pay), the full admin journey
(stats → edit prefill → add car → filters → search), cross-role redirects, the
extension-less URLs, and the Google Sign-In wiring with the GSI global stubbed.
65 checks pass with no console errors. Three bugs that testing caught and fixed:
a duplicate `id="logoutBtn"` from rendering the account block twice, missing
`text-decoration: none` on anchor-styled buttons, and toasts being lost across
page navigations.

**Not compiled.** This sandbox has no route to Maven Central, so `mvn compile`
and `mvn test` could not be run. The Java was written and reviewed by hand, but
a typo'd import or a wrong `google-api-client` coordinate would not have been
caught. Run `mvn clean package` as your first step — if anything fails to
compile, send me the error and I'll fix it.

**Not exercised against the real Google.** `accounts.google.com` is blocked
here, so the token round trip was tested with a stub. The server-side
`GoogleIdTokenVerifier` path has never executed against a genuine ID token.
