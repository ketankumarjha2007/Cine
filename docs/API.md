# Backend API Reference

Base Path: `/api`

All JSON error responses follow the standard format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation"
  }
}
```

---

## 1. System Health

### `GET /health`
Public health probe.
- **Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-11-13T14:30:00.000Z"
}
```

---

## 2. Customer Bookings

### `POST /bookings/hold`
Hold selected seats atomically for the authenticated customer.
- **Authentication:** Bearer token required.
- **Rate Limit:** 60 requests per 15 minutes.
- **Request Body:**
```json
{
  "showId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "seatIds": [
    "e2b9c3f1-4f1e-4cb8-8c1d-123456789abc",
    "f3c0d4a2-5a2f-5dc9-9d2e-234567890bcd"
  ]
}
```
- **Response:** `200 OK`
```json
{
  "bookingId": "c4d1e5b3-6b3a-6ed0-0e3f-345678901cde",
  "bookingCode": "A1B2C3D4",
  "subtotal": 500.00,
  "convenienceFee": 0.00,
  "total": 500.00,
  "expiresAt": "2026-11-13T14:38:00.000Z"
}
```

### `POST /bookings/:id/release`
Release a pending seat hold when leaving checkout.
- **Authentication:** Bearer token required.
- **Response:** `200 OK`
```json
{
  "success": true
}
```

### `GET /bookings/me`
List all bookings for the authenticated user.
- **Authentication:** Bearer token required.
- **Response:** `200 OK`

### `GET /bookings/:id`
Retrieve full bill details for a booking owned by user or inspected by admin.
- **Authentication:** Bearer token required.
- **Response:** `200 OK`

### `POST /bookings/:id/cancel`
Cancel a confirmed booking before show start, initiate a Razorpay refund, and send cancellation email.
- **Authentication:** Bearer token required.
- **Response:** `200 OK`
```json
{
  "success": true,
  "status": "CANCELLED",
  "bookingId": "c4d1e5b3-6b3a-6ed0-0e3f-345678901cde",
  "refundId": "rfnd_123456789",
  "refundAmount": 500.00
}
```

---

## 3. Payments

### `POST /payments/create-order`
Creates a Razorpay order in test mode. Amount is calculated strictly on the server in paise.
- **Authentication:** Bearer token required.
- **Request Body:**
```json
{
  "bookingId": "c4d1e5b3-6b3a-6ed0-0e3f-345678901cde"
}
```
- **Response:** `200 OK`
```json
{
  "orderId": "order_EKfLvuafAUqlSu",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_YourKeyHere"
}
```

### `POST /payments/verify`
Verify HMAC SHA256 signature using timing-safe comparison, call `confirm_booking`, and dispatch email.
- **Authentication:** Bearer token required.
- **Request Body:**
```json
{
  "razorpay_order_id": "order_EKfLvuafAUqlSu",
  "razorpay_payment_id": "pay_29QQoUBi66xm2f",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d840193e13ced"
}
```
- **Response:** `200 OK`
```json
{
  "success": true,
  "bookingId": "c4d1e5b3-6b3a-6ed0-0e3f-345678901cde"
}
```

### `POST /payments/webhook`
Receives raw JSON body from Razorpay with `X-Razorpay-Signature` validation.
- **Headers:** `X-Razorpay-Signature`
- **Response:** `200 OK`

---

## 4. TMDB Proxy

### `GET /tmdb/movie/:id`
Fetches movie details, Indian/US certifications, trailer keys, and top 10 cast credits from TMDB via the server.
- **Authentication:** Public.
- **Response:** `200 OK`

---

## 5. Admin Management (Requires `role: 'admin'`)

- `GET /admin/movies` - List movies with pagination and title search.
- `POST /admin/movies/import` - Import Now Playing & Upcoming titles from TMDB (Region: IN).
- `POST /admin/movies` - Create manual movie entry.
- `PUT /admin/movies/:id` - Update movie or archive.
- `GET /admin/theatres` - List theatres with screen counts and coordinates.
- `GET /admin/theatres/geocode?q=` - Search coordinates via OpenStreetMap Nominatim.
- `POST /admin/theatres` - Create theatre with geospatial point.
- `PUT /admin/theatres/:id` - Update theatre.
- `DELETE /admin/theatres/:id` - Delete theatre.
- `POST /admin/screens` - Create screen and generate row seats.
- `DELETE /admin/screens/:id` - Delete screen (blocked if future shows scheduled).
- `GET /admin/shows` - List shows by date, movie, or theatre.
- `POST /admin/shows` - Schedule show with overlap exclusion validation.
- `PUT /admin/shows/:id` - Update show.
- `GET /admin/banners` - List promotional banners.
- `POST /admin/banners` - Create banner.
- `PUT /admin/banners/:id` - Update banner.
- `DELETE /admin/banners/:id` - Delete banner.
- `GET /admin/bookings` - Search, filter, and inspect all customer reservations.
- `GET /admin/reports?from=&to=` - Aggregated revenue, bookings, seats sold.
- `GET /admin/reports/export?from=&to=` - Export financial records as CSV.
