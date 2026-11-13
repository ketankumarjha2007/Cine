# System Architecture Overview

CineTicket is architected as a high-reliability, cloud-native full-stack application designed to handle high-concurrency ticket reservations, real-time seat locks, and transactional payment workflows.

```mermaid
flowchart TD
    Client["React 18 + Vite SPA (Vercel)"]
    Server["Express API Server (Render)"]
    SupabaseDB["Supabase Postgres + PostGIS + pg_cron"]
    SupabaseRealtime["Supabase Realtime Engine"]
    RazorpayAPI["Razorpay Payment Gateway"]
    BrevoAPI["Brevo Transactional Email REST API"]
    TMDBAPI["TMDB Movie Database API"]

    Client -->|Axios with JWT| Server
    Client -->|Postgres Changes Subscription| SupabaseRealtime
    Client -->|Checkout.js Modal| RazorpayAPI
    Server -->|Service Role Client| SupabaseDB
    Server -->|Order Creation & Verification| RazorpayAPI
    RazorpayAPI -->|X-Razorpay-Signature Webhook| Server
    Server -->|Transactional Confirmation / Cancellation| BrevoAPI
    Server -->|Now Playing & Credits Import| TMDBAPI
```

## Seat Hold & Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant ReactClient as React Client
    participant ExpressAPI as Express API
    participant Postgres as Supabase Postgres
    participant Gateway as Razorpay
    participant Brevo as Brevo Email

    Customer->>ReactClient: Selects seats & clicks Proceed
    ReactClient->>ExpressAPI: POST /api/bookings/hold
    ExpressAPI->>Postgres: SELECT hold_seats() (Atomic Transaction)
    Postgres-->>ExpressAPI: Booking PENDING, Seats HELD (Hold timer active)
    ExpressAPI-->>ReactClient: Returns bookingId and expiresAt
    ReactClient->>Customer: Display Checkout countdown

    Customer->>ReactClient: Clicks Pay Now
    ReactClient->>ExpressAPI: POST /api/payments/create-order
    ExpressAPI->>Gateway: Create Order (Paise calculated on server)
    Gateway-->>ExpressAPI: order_id
    ExpressAPI-->>ReactClient: order_id, key_id
    ReactClient->>Gateway: Opens Checkout.js

    Customer->>Gateway: Completes Test Payment
    Gateway-->>ReactClient: razorpay_payment_id, signature
    ReactClient->>ExpressAPI: POST /api/payments/verify
    ExpressAPI->>ExpressAPI: Timing-safe HMAC SHA256 Verification
    ExpressAPI->>Postgres: confirm_booking() (CONFIRMED & BOOKED)
    ExpressAPI->>Brevo: Send Confirmation Email
    ExpressAPI-->>ReactClient: Confirmation Success
    ReactClient->>Customer: Renders Ticket Pass & enables Download Bill
```

## Webhook Safety Net

If a customer closes their browser or encounters network disconnection immediately after authorization on Razorpay:
1. Razorpay dispatches `POST /api/payments/webhook` with signature `X-Razorpay-Signature`.
2. The server verifies HMAC SHA256 using `RAZORPAY_WEBHOOK_SECRET`.
3. Event idempotency is checked against `webhook_events`.
4. If not confirmed, `bookingService.processPaymentCapture` confirms the booking and dispatches the confirmation email.
5. Once confirmed, repeated webhook notifications or late verify calls execute idempotently without duplicating emails or records.
