import crypto from 'crypto';
import { razorpayInstance } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { bookingService } from './bookingService.js';

export const paymentService = {
  async createOrder({ bookingId, userId }) {
    // 1. Fetch booking and verify ownership and hold validity
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, status, total_amount, hold_expires_at, razorpay_order_id')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found or access denied');
    }

    if (booking.status !== 'PENDING') {
      throw new Error(`Booking cannot be paid (status: ${booking.status})`);
    }

    const expiresAt = new Date(booking.hold_expires_at).getTime();
    if (Date.now() > expiresAt) {
      // Mark as expired
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'EXPIRED' })
        .eq('id', bookingId);

      await supabaseAdmin
        .from('booking_seats')
        .update({ status: 'RELEASED' })
        .eq('booking_id', bookingId);

      throw new Error('Seat hold has expired. Please select seats again.');
    }

    // Amount in paise calculated strictly on server
    const amountInPaise = Math.round(booking.total_amount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${booking.id.replace(/-/g, '').slice(0, 16)}`,
      notes: {
        project: 'movie-booking',
        booking_id: booking.id
      }
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    // Save order id to booking
    await supabaseAdmin
      .from('bookings')
      .update({ razorpay_order_id: order.id })
      .eq('id', booking.id);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID
    };
  },

  async verifyPayment({ orderId, paymentId, signature, userId }) {
    // 1. Verify cryptographic HMAC SHA256 signature with timingSafeEqual
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!isMatch) {
      throw new Error('Payment signature verification failed. Untrusted payment.');
    }

    // 2. Find booking associated with order
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, total_amount')
      .eq('razorpay_order_id', orderId)
      .single();

    if (error || !booking) {
      throw new Error('No matching booking found for this payment order');
    }

    if (userId && booking.user_id !== userId) {
      throw new Error('Payment booking does not match authenticated user');
    }

    // 3. Confirm booking and send email
    const confirmResult = await bookingService.processPaymentCapture({
      bookingId: booking.id,
      orderId,
      paymentId,
      signature,
      amount: booking.total_amount
    });

    return {
      success: true,
      bookingId: booking.id,
      result: confirmResult
    };
  }
};
