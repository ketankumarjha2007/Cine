# Deployment Guide

This guide details deploying CineTicket across Vercel (client), Render (backend server), and Supabase (managed database & storage).

---

## 1. Supabase Setup

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to **Database > Extensions** and enable:
   - `postgis`
   - `btree_gist`
   - `pg_cron`
   - `pgcrypto`
3. Navigate to **SQL Editor** and execute the SQL scripts located in `supabase/` strictly in sequence:
   - `01_extensions.sql`
   - `02_schema.sql`
   - `03_functions.sql`
   - `04_policies.sql`
   - `05_cron.sql`
   - `06_storage.sql`
4. Confirm the `media` bucket is created in **Storage** and set to Public.
5. In **Authentication > URL Configuration**, add your production client URL and local development URLs to the Redirect URLs list.

### Granting Initial Administrator Privileges
After creating your first user via `/signup`, navigate to **Table Editor > profiles** in Supabase and change the `role` column value from `'user'` to `'admin'` for your account row.

---

## 2. Backend Server Deployment (Render)

1. Connect your repository to [Render](https://render.com) and create a **Web Service**.
2. Configure the service:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add the required Environment Variables in Render dashboard:
   - `PORT`: `5000` (or leave default, Render sets `PORT`)
   - `CLIENT_URL`: `https://your-cineticket-app.vercel.app`
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `ey...` (from Supabase Project Settings > API)
   - `RAZORPAY_KEY_ID`: `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: `...`
   - `RAZORPAY_WEBHOOK_SECRET`: `...`
   - `BREVO_API_KEY`: `xkeysib-...`
   - `BREVO_SENDER_EMAIL`: `your-verified-sender@domain.com`
   - `BREVO_SENDER_NAME`: `CineTicket`
   - `TMDB_API_KEY`: `...`
   - `SEAT_HOLD_MINUTES`: `8`
   - `CONVENIENCE_FEE_PERCENT`: `0`

---

## 3. Frontend Client Deployment (Vercel)

1. Import your project in [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Configure Client Environment Variables:
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `ey...` (from Supabase Project Settings > API)
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_...`
   - `VITE_API_URL`: `https://your-cineticket-api.onrender.com/api`
5. Deploy. The included `vercel.json` ensures all React Router paths correctly rewrite to `index.html`.

---

## 4. Razorpay Webhook Configuration

1. In the [Razorpay Dashboard](https://dashboard.razorpay.com), navigate to **Settings > Webhooks**.
2. Click **Add New Webhook**:
   - **Webhook URL:** `https://your-cineticket-api.onrender.com/api/payments/webhook`
   - **Secret:** Enter a strong random secret and copy it into `RAZORPAY_WEBHOOK_SECRET` on Render.
   - **Active Events:**
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
3. Save the webhook.

---

## 5. Brevo Transactional Email Setup

1. Log in to [Brevo](https://www.brevo.com).
2. Go to **Senders, Domains & Dedicated IPs > Senders** and add a verified sender email address.
3. Go to **SMTP & API > API Keys** and generate an API key.
4. Add the key as `BREVO_API_KEY` on Render.
