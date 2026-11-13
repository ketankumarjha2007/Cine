import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentService } from '../services/paymentService.js';
import { paymentLimiter } from '../middleware/rateLimit.js';

const router = Router();

const createOrderSchema = {
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID')
  })
};

const verifyPaymentSchema = {
  body: z.object({
    razorpay_order_id: z.string().min(1, 'Order ID required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID required'),
    razorpay_signature: z.string().min(1, 'Signature required')
  })
};

// POST /api/payments/create-order
router.post('/create-order', authenticateUser, paymentLimiter, validate(createOrderSchema), async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const order = await paymentService.createOrder({
      bookingId,
      userId: req.user.id
    });
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/verify
router.post('/verify', authenticateUser, paymentLimiter, validate(verifyPaymentSchema), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await paymentService.verifyPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      userId: req.user.id
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
