import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import webhookRoutes from './routes/webhook.js';
import bookingsRoutes from './routes/bookings.js';
import paymentsRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import tmdbRoutes from './routes/tmdb.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration restricted to client URL
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));

// Apply general rate limiting
app.use(generalLimiter);

// 1. Webhook route: Raw body parsing MUST be registered before standard express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// 2. Standard JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Mount Routes
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'CinTicket Cinema REST API is operational',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      bookings: '/api/bookings',
      payments: '/api/payments',
      admin: '/api/admin',
      tmdb: '/api/tmdb'
    }
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tmdb', tmdbRoutes);

// 4. Central Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER RUNNING] CineTicket backend operational on port ${PORT}`);
});

export default app;
