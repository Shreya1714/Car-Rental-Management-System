# DriveEasy Rentals — React Frontend

## Setup
```bash
npm install
npm run dev        # Dev server at http://localhost:5173 (proxies /api → localhost:8080)
npm run build      # Production build → dist/
```

## Connect to Spring Boot
Start the Spring Boot backend on port 8080 first, then run `npm run dev`.
The Vite dev server proxies all `/api` requests to `http://localhost:8080`.

## For production (serve dist/ from Spring Boot)
Copy contents of `dist/` into `src/main/resources/static/` in the Spring Boot project.
