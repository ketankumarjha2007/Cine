# CineTicket - Movie Ticket Booking Web Application

A full-stack, production-quality movie ticket booking web application designed with the depth, polish, and reliability of commercial platforms like BookMyShow.

---

## 1. Features Overview

- **Realtime Seat Mapping:** Live seat layout powered by Supabase Realtime with category tiers (Standard, Premium, VIP), accessible keyboard navigation, and interactive visual screen indicators.
- **Atomic Hold Protection:** Multi-layered double-booking prevention utilizing PostgreSQL partial unique indexes (`(show_id, seat_id) WHERE status IN ('HELD', 'BOOKED')`), row-level locks, and an 8-minute countdown timer.
- **Razorpay Payments in Test Mode:** Server-side order generation in paise, timing-safe HMAC SHA256 signature verification, and idempotent webhook handling for network failure resilience.
- **Brevo Transactional Emails:** Fully responsive HTML and plain-text booking confirmations and cancellation notices with refund breakdowns.
- **Client-Side PDF Invoicing:** Instant tax bills generated using jsPDF and jspdf-autotable in IST timezone with scannable QR codes.
- **Geospatial Discovery:** PostGIS-powered nearby theatre locator, interactive Leaflet and OpenStreetMap map picker, and browser Geolocation integration.
- **TMDB Catalog Integration:** Direct server-side synchronization of Now Playing and Upcoming films (Region: IN) with certification, trailer keys, and credits.
- **Administrative Suite:** Complete back-office controls for movie catalogs, auditorium layouts, overlap-guarded show schedules, promotional hero banners, customer booking inspection, and CSV financial reporting.

---

## 2. Technology Stack

- **Client:** React 18, Vite, React Router 6, Axios, Supabase Client, Lucide React, jsPDF, jsPDF-AutoTable, QRCode, Leaflet, Plain CSS with CSS Custom Properties.
- **Server:** Node.js, Express, Helmet, CORS, Express-Rate-Limit, Zod, Supabase Admin SDK, Razorpay SDK.
- **Database & Services:** Supabase Postgres, Supabase Auth, Supabase Storage, PostGIS, pg_cron, btree_gist, Razorpay Test Gateway, Brevo Email REST API, TMDB API.

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Supabase account with a new project

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Install client dependencies:
```bash
cd ../client
npm install
```

### Environment Variables

Configure `server/.env` based on `server/.env.example`:
```ini
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your-verified-email@domain.com
BREVO_SENDER_NAME=CineTicket
TMDB_API_KEY=your_tmdb_v3_api_key
SEAT_HOLD_MINUTES=8
CONVENIENCE_FEE_PERCENT=0
```

Configure `client/.env` based on `client/.env.example`:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_API_URL=http://localhost:5000/api
```

### Development Execution

Run the backend server:
```bash
cd server
npm run dev
```

In a separate terminal, start the frontend client:
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` to explore the application.

---

## 4. Manual Configuration Steps

1. **Database Schema:** In your Supabase SQL Editor, run the scripts in `supabase/` in the following sequence:
   - `01_extensions.sql`
   - `02_schema.sql`
   - `03_functions.sql`
   - `04_policies.sql`
   - `05_cron.sql`
   - `06_storage.sql`
2. **Promote First Admin:** Register a new user account via `/signup`. In Supabase **Table Editor > profiles**, update the `role` column of that user row from `'user'` to `'admin'`.
3. **TMDB Catalog Import:** Log into the application with your admin account, navigate to **Admin Console > Movies**, and click **Import TMDB (India)** to automatically populate active releases.
4. **Razorpay Webhook:** In Razorpay Dashboard, set the Webhook URL to `https://<your-backend-domain>/api/payments/webhook` with events `payment.captured`, `payment.failed`, and `refund.processed`.
5. **Brevo Verification:** Ensure the sender email specified in `BREVO_SENDER_EMAIL` is verified in your Brevo account.

---

## 5. Architectural Assumptions & Limitations

- **Razorpay Test Mode:** All payments are executed in test mode using test cards. No real financial transactions are executed.
- **Geocoding Policy:** The admin theatre geocoding helper connects to OpenStreetMap Nominatim with a custom identification header. Heavy automated batch geocoding is restricted per Nominatim usage policies.
- **Client Storage:** The public `media` storage bucket requires Supabase credentials for file writes; unauthenticated client uploads are blocked by RLS policies.
