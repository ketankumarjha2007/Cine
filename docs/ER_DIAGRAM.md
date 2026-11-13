# Entity-Relationship Diagram

This document illustrates the database entities, attributes, and relationships across the CineTicket movie booking platform.

```mermaid
erDiagram
    PROFILES ||--o{ BOOKINGS : "places"
    MOVIES ||--o{ SHOWS : "scheduled_in"
    THEATRES ||--o{ SCREENS : "contains"
    SCREENS ||--o{ SEATS : "has"
    SCREENS ||--o{ SHOWS : "hosts"
    SHOWS ||--o{ BOOKINGS : "booked_for"
    SHOWS ||--o{ BOOKING_SEATS : "allocates"
    BOOKINGS ||--o{ BOOKING_SEATS : "reserves"
    BOOKINGS ||--o{ PAYMENTS : "paid_by"
    SEATS ||--o{ BOOKING_SEATS : "mapped_to"

    PROFILES {
        uuid id PK
        string full_name
        string phone
        string role "user or admin"
        timestamptz created_at
    }

    MOVIES {
        uuid id PK
        int tmdb_id UK
        string title
        string overview
        string language
        string_array genres
        int duration_minutes
        date release_date
        string certificate
        string poster_url
        string backdrop_url
        string trailer_key
        numeric rating
        string status "now_showing, upcoming, archived"
        timestamptz created_at
    }

    THEATRES {
        uuid id PK
        string name
        string address
        string city
        string state
        string pincode
        geography location "Point 4326"
        string image_url
        string_array amenities
        timestamptz created_at
    }

    SCREENS {
        uuid id PK
        uuid theatre_id FK
        string name
        string screen_type
        int total_seats
        timestamptz created_at
    }

    SEATS {
        uuid id PK
        uuid screen_id FK
        string row_label
        int seat_number
        string category "Standard, Premium, VIP"
        timestamptz created_at
    }

    SHOWS {
        uuid id PK
        uuid movie_id FK
        uuid screen_id FK
        timestamptz starts_at
        timestamptz ends_at
        string language
        string format
        jsonb price_by_category
        string status "scheduled or cancelled"
        timestamptz created_at
    }

    BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid show_id FK
        string status "PENDING, CONFIRMED, CANCELLED, EXPIRED"
        numeric subtotal
        numeric convenience_fee
        numeric total_amount
        string razorpay_order_id UK
        timestamptz hold_expires_at
        boolean email_sent
        string booking_code UK
        timestamptz created_at
        timestamptz confirmed_at
        timestamptz cancelled_at
    }

    BOOKING_SEATS {
        uuid id PK
        uuid booking_id FK
        uuid show_id FK
        uuid seat_id FK
        numeric price
        string status "HELD, BOOKED, RELEASED"
        timestamptz created_at
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        string razorpay_order_id
        string razorpay_payment_id UK
        string razorpay_signature
        numeric amount
        string currency
        string status "CREATED, PAID, FAILED, REFUNDED"
        string refund_id
        timestamptz created_at
    }

    BANNERS {
        uuid id PK
        string title
        string subtitle
        string image_url
        string link_url
        int sort_order
        boolean active
        timestamptz created_at
    }

    WEBHOOK_EVENTS {
        string id PK
        jsonb payload
        timestamptz processed_at
    }
```

## Hard Double-Booking Guarantee

The critical guarantee against race conditions and concurrent bookings is enforced at the database level:

1. Partial unique index on `booking_seats (show_id, seat_id) WHERE status IN ('HELD', 'BOOKED')`.
2. Row-level transaction locks using `FOR SHARE` during `hold_seats`.
3. Screen showtime overlap exclusion constraint using `btree_gist` and `EXCLUDE USING gist (screen_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`.
