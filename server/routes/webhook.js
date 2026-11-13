import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { bookingService } from '../services/bookingService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature missing or unconfigured' } });
    }

    const bodyString = req.body.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      return res.status(400).json({ error: { code: 'SIGNATURE_VERIFICATION_FAILED', message: 'Invalid webhook signature' } });
    }

    const payload = JSON.parse(bodyString);
    const eventId = payload.event_id || `${payload.event}_${payload.payload?.payment?.entity?.id || Date.now()}`;

    // Check idempotency via webhook_events
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (existingEvent) {
      return res.status(200).json({ status: 'already_processed' });
    }

    // Insert into webhook_events
    await supabaseAdmin
      .from('webhook_events')
      .insert({ id: eventId, payload, processed_at: new Date().toISOString() });

    const event = payload.event;
    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const bookingId = payment.notes?.booking_id;

      if (bookingId) {
        await bookingService.processPaymentCapture({
          bookingId,
          orderId,
          paymentId,
          signature: 'webhook_captured',
          amount: payment.amount / 100
        });
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const bookingId = payment.notes?.booking_id;
      if (bookingId) {
        await supabaseAdmin
          .from('payments')
          .insert({
            booking_id: bookingId,
            razorpay_order_id: payment.order_id,
            razorpay_payment_id: payment.id,
            razorpay_signature: 'webhook_failed',
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            status: 'FAILED'
          });
      }
    } else if (event === 'refund.processed') {
      const refund = payload.payload.refund.entity;
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'REFUNDED',
          refund_id: refund.id
        })
        .eq('razorpay_payment_id', refund.payment_id);
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    // Always return 200 to acknowledge receipt once verified to avoid repeat retries from Razorpay if internal error
    return res.status(200).json({ status: 'error_logged' });
  }
});

export default router;
