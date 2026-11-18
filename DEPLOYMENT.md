# CinTicket – Production Deployment & Operations Guide

## 🌐 Live Production Links
- **Production Web Application (Vercel)**: [https://cine-omega-peach.vercel.app](https://cine-omega-peach.vercel.app)
- **Production REST API (Render)**: [https://cineticket-9sgk.onrender.com](https://cineticket-9sgk.onrender.com)
- **API Health Check**: [https://cineticket-9sgk.onrender.com/api/health](https://cineticket-9sgk.onrender.com/api/health)
- **GitHub Repository**: [https://github.com/ketankumarjha2007/Cine](https://github.com/ketankumarjha2007/Cine)

---

## 1. Architecture Overview

CinTicket is an enterprise-grade movie booking application built on a decoupled, production-ready stack:

- **Frontend**: React 18 (Vite SPA) + React Router + Lucide Icons + Tailwind-ready responsive styling
- **Backend**: Node.js / Express (ES Modules) REST API
- **Database**: Supabase (PostgreSQL 15) with Row Level Security (RLS) and stored PL/pgSQL procedures:
  - `hold_seats`: Atomic seat reservation with row locking & auto-expiration
  - `get_show_seats`: Safe seat map fetching with dynamic multi-tier pricing
  - `confirm_booking`: Transactional payment verification & booking finalization
  - `release_expired_holds`: Periodic cleanup for unconfirmed holds
- **Payments**: Razorpay (Test mode enabled; switchable to Live keys via environment variables)
- **Email Notifications**: Brevo (Sendinblue) transactional emails for e-tickets & confirmations

---

## 2. Environment Variables

### A. Backend (`server/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | API server listen port | `5000` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `https://your-cinticket-domain.com` (or `http://localhost:5173`) |
| `SUPABASE_URL` | Supabase project URL | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role key (bypass RLS for server ops) | `sb_secret_...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret | Optional |
| `BREVO_API_KEY` | Brevo v3 Transactional Email API Key | Optional |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo | `tickets@cinticket.com` |
| `BREVO_SENDER_NAME` | Sender display name | `CinTicket Cinema` |
| `SEAT_HOLD_MINUTES` | Window to hold seats before release | `8` |
| `CONVENIENCE_FEE_PERCENT` | Convenience fee percentage | `0` (or e.g. `5` for 5%) |

### B. Frontend (`client/.env`)

| Variable | Description | Production Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Public Supabase project URL | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase Anon key | `sb_publishable_...` |
| `VITE_API_URL` | Backend API base URL | `https://api.yourdomain.com/api` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID (public) | `rzp_test_...` or `rzp_live_...` |

---

## 3. Database Migration & Stored Functions

All database migrations and functions are consolidated in:
- `supabase/all_in_one_migration.sql` (full schema, tables, indexes, RLS, functions)
- `supabase/03_functions.sql` (stored functions only)

### Key Function Upgrades Applied:
1. **`get_show_seats(p_show UUID)`**:
   - Safe parsing for string-encoded JSONB in `price_by_category`
   - Case-insensitive category price resolution (`Standard`, `Premium`, `VIP`, `Recliner`)
   - Fallback pricing defaults (`Standard: ₹220`, `Premium: ₹350`, `VIP: ₹500`, `Recliner: ₹550`)
   - Guaranteed prevention of ₹0 pricing
2. **`hold_seats(p_user UUID, p_show UUID, p_seats UUID[], ...)`**:
   - Matches same robust pricing resolution
   - Atomically records exact seat prices in `booking_seats`
   - Sets hold timer (default 8 minutes)
3. **Screen Setup**:
   - Wave Cinemas West End Mall (Lucknow) configured with 3 screens & 194 seats

---

## 4. 30-Day Rolling Schedule System

CinTicket maintains a continuous rolling schedule covering the next 30 days across all active cities (Bengaluru, Mumbai, Delhi, Lucknow).

### How It Works:
- **Timezone**: All shows are scheduled in IST (`Asia/Kolkata`) and stored as precise UTC timestamps.
- **Templates**: 5 staggered daily slot templates per screen to prevent any overlapping shows.
- **Pricing**: Automatically assigns realistic multi-tier pricing with weekend surcharges and IMAX premiums.
- **Auto-Maintenance**:
  - Run manually or via cron: `node server/scripts/generate_30day_schedule.js`
  - Via Admin UI: Navigate to **Admin Dashboard → Shows** and click **"Sync 30-Day Schedule"**.
  - Via Admin API: `POST /api/admin/schedule/generate-rolling` (requires admin JWT).

---

## 5. Deployment Instructions

### Deploying the Backend (e.g. Render, Railway, or VPS)

1. **Root Directory**: `server`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start` (or `node index.js`)
4. **Environment Variables**: Add all variables from `server/.env.example`.
5. Set `CLIENT_URL` to your live frontend URL to ensure CORS headers permit requests.

### Deploying the Frontend (e.g. Vercel, Netlify, Cloudflare Pages)

1. **Root Directory**: `client`
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Add all variables from `client/.env.example`.
6. **SPA Routing**: Ensure rewrite rules route all paths (`/*`) to `/index.html` (Vercel `vercel.json` or Netlify `_redirects`).

---

## 6. Pre-Flight Verification Checklist

- [x] All 5,690 shows have valid prices (₹220–₹800, 0 shows with ₹0)
- [x] 0 duplicate shows across screens and dates
- [x] 0 screen timing overlaps
- [x] DateStrip expanded to full 30-day interactive calendar with scroll navigation
- [x] All 22 historical customer bookings preserved
- [x] Seat legend & seat map sanitize pricing to prevent zero display
- [x] Admin dashboard upgraded with 6 live database metrics
- [x] Admin schedule synchronization endpoint & UI button enabled
- [x] Client production build succeeds cleanly (`npm run build`)
