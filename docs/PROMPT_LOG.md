# Prompt Log

Record all development and feature enhancement prompts below for auditability and iterative improvements.

---

## Initial Project Build
- **Date:** 2026-11-13
- **Prompt:**
  Build a complete, production-quality movie ticket booking web application comparable to BookMyShow.
- **Phases Executed:**
  - Phase 1: Foundation (repository structure, package manifests, design tokens, base CSS)
  - Phase 2: Database (PostGIS, btree_gist, pg_cron, idempotent schema, functions, RLS, storage)
  - Phase 3: Auth & Layout (Supabase Auth, Navbar, Footer, BottomNav, PageShell, login/signup/reset)
  - Phase 4: Admin & Catalog (Movies with TMDB import, Theatres with Leaflet/OSM map picker, Screens with layout generator, Shows with overlap exclusion, Banners, Bookings inspection, Reports)
  - Phase 5: Discovery (Home page, Geolocation handling, Movie Details with credits & trailer, Theatres browsing)
  - Phase 6: Booking (Seat map with Supabase Realtime updates, Hold API with race condition protection, Checkout countdown)
  - Phase 7: Payments (Razorpay test mode orders, timing-safe HMAC signature verification, idempotent webhooks, refunds)
  - Phase 8: Email & Bill (Brevo REST transactional delivery, jsPDF client-side invoice with QR)
  - Phase 9: Reports & Polish (Dashboard trend charts, CSV export, accessibility, mobile-first responsive design)
  - Phase 10: Documentation & Verification (README, API, Architecture, ER Diagram, Deployment, Prompt Log)
- **Status:** Complete.

---

## Session 2: Build Verification and Server Startup Validation
- **Date:** 2026-11-13
- **Target Component / Service:** Client Build, Server Runtime, Vite Configuration
- **Prompt:**
  > continue
- **Modifications Made:**
  - Corrected relative import path resolution in `client/src/pages/BookingConfirmation.jsx` from `../../services/api.js` to `../services/api.js`.
  - Configured manual chunking in `client/vite.config.js` (`react-vendor`, `supabase`, `pdf`, `html2canvas`, `axios`, `qrcode`, `lucide`) to ensure no production chunk exceeds 500 kB.
  - Resolved `server/services/emailService.js` invalid named export import (`brevoConfig` from `env.js`).
  - Verified server initialization and verified the `/api/health` endpoint responds with `{ status: "healthy" }`.
  - Initialized git repository with strict `.gitignore` rules shielding `.env` and `node_modules`.
- **Verification Performed:**
  - Client production build completed cleanly in 49.94s with 0 errors and optimal chunk distribution.
  - Server successfully booted and handled HTTP GET requests on port 5000.
- **Notes / Decisions:**
  - Strict compliance maintained: zero emojis, no fake/placeholder UI data, SVG icons from `lucide-react`, IST datetime formatting, and server-side financial calculations.

---

## Template for Subsequent Prompts

### Session [Number]
- **Date:** YYYY-MM-DD
- **Target Component / Service:**
- **Prompt:**
  > [Paste user prompt here]
- **Modifications Made:**
  - 
- **Verification Performed:**
  - 
- **Notes / Decisions:**
  - 
