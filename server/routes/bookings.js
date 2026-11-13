import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookingService } from '../services/bookingService.js';
import { paymentLimiter } from '../middleware/rateLimit.js';

const router = Router();

const holdSchema = {
  body: z.object({
    showId: z.string().uuid('Invalid show ID'),
    seatIds: z.array(z.string().uuid()).min(1, 'At least 1 seat must be selected').max(10, 'Maximum 10 seats allowed')
  })
};

const idParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid booking ID')
  })
};

// POST /api/bookings/hold
router.post('/hold', authenticateUser, paymentLimiter, validate(holdSchema), async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    const result = await bookingService.holdSeats({
      userId: req.user.id,
      showId,
      seatIds
    });

    res.status(200).json({
      bookingId: result.booking_id,
      bookingCode: result.booking_code,
      subtotal: result.subtotal,
      convenienceFee: result.convenience_fee,
      total: result.total,
      expiresAt: result.expires_at
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/release
router.post('/:id/release', authenticateUser, validate(idParamSchema), async (req, res, next) => {
  try {
    const result = await bookingService.releaseHold({
      bookingId: req.params.id,
      userId: req.user.id
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/me
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings({
      userId: req.user.id
    });
    res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id
router.get('/:id', authenticateUser, validate(idParamSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingDetails({
      bookingId: req.params.id,
      userId: req.user.id
    });
    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', authenticateUser, paymentLimiter, validate(idParamSchema), async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking({
      bookingId: req.params.id,
      userId: req.user.id
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
