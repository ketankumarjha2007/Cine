import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { emailService } from './emailService.js';
import { razorpayInstance } from '../config/razorpay.js';

export const bookingService = {
  async holdSeats({ userId, showId, seatIds }) {
    // 1. Release any existing pending holds for this user first
    // This strictly restricts each user to 1 active hold at a time and prevents monopolizing seats
    try {
      const { data: existingHolds } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'PENDING');

      if (existingHolds && existingHolds.length > 0) {
        const holdIds = existingHolds.map((h) => h.id);
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'EXPIRED' })
          .in('id', holdIds);

        await supabaseAdmin
          .from('booking_seats')
          .update({ status: 'RELEASED' })
          .in('booking_id', holdIds);
      }
    } catch (cleanupErr) {
      console.warn('[CLEANUP OLD HOLDS WARN]', cleanupErr.message);
    }

    const { data, error } = await supabaseAdmin.rpc('hold_seats', {
      p_user: userId,
      p_show: showId,
      p_seats: seatIds,
      p_hold_minutes: env.SEAT_HOLD_MINUTES,
      p_convenience_fee_percent: env.CONVENIENCE_FEE_PERCENT
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async releaseHold({ bookingId, userId }) {
    // Only release if PENDING and owned by user
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (!booking || booking.status !== 'PENDING') {
      return { success: false, reason: 'NOT_PENDING_OR_NOT_FOUND' };
    }

    await supabaseAdmin
      .from('bookings')
      .update({ status: 'EXPIRED' })
      .eq('id', bookingId);

    await supabaseAdmin
      .from('booking_seats')
      .update({ status: 'RELEASED' })
      .eq('booking_id', bookingId);

    return { success: true };
  },

  async getUserBookings({ userId }) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_code,
        status,
        subtotal,
        convenience_fee,
        total_amount,
        created_at,
        confirmed_at,
        cancelled_at,
        shows:show_id (
          id,
          starts_at,
          ends_at,
          language,
          format,
          movie:movie_id (
            id,
            title,
            poster_url,
            certificate,
            duration_minutes
          ),
          screen:screen_id (
            id,
            name,
            theatre:theatre_id (
              id,
              name,
              address,
              city
            )
          )
        ),
        booking_seats (
          id,
          price,
          status,
          seat:seat_id (
            id,
            row_label,
            seat_number,
            category
          )
        ),
        payments (
          razorpay_payment_id,
          status,
          amount,
          refund_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getBookingDetails({ bookingId, userId, isAdmin = false }) {
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_code,
        status,
        subtotal,
        convenience_fee,
        total_amount,
        hold_expires_at,
        created_at,
        confirmed_at,
        cancelled_at,
        shows:show_id (
          id,
          starts_at,
          ends_at,
          language,
          format,
          movie:movie_id (
            id,
            title,
            poster_url,
            certificate,
            duration_minutes
          ),
          screen:screen_id (
            id,
            name,
            theatre:theatre_id (
              id,
              name,
              address,
              city,
              state,
              pincode
            )
          )
        ),
        booking_seats (
          id,
          price,
          status,
          seat:seat_id (
            id,
            row_label,
            seat_number,
            category
          )
        ),
        payments (
          id,
          razorpay_order_id,
          razorpay_payment_id,
          amount,
          currency,
          status,
          refund_id,
          created_at
        )
      `)
      .eq('id', bookingId);

    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: booking, error } = await query.single();
    if (error || !booking) {
      const notFoundErr = new Error('Booking not found or access denied');
      notFoundErr.status = 404;
      notFoundErr.isPublic = true;
      throw notFoundErr;
    }

    // Get user profile email safely
    let customerName = 'Valued Customer';
    let customerEmail = '';

    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', booking.user_id)
        .maybeSingle();

      if (profile?.full_name) {
        customerName = profile.full_name;
      }

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
      if (authUser?.user?.email) {
        customerEmail = authUser.user.email;
      }
    } catch (userErr) {
      console.warn('[BOOKING DETAILS] Could not fetch customer profile info:', userErr.message);
    }

    return {
      ...booking,
      customerName,
      customerEmail
    };
  },

  async processPaymentCapture({ bookingId, orderId, paymentId, signature, amount }) {
    // Call confirm_booking procedure
    const { data: confirmResult, error } = await supabaseAdmin.rpc('confirm_booking', {
      p_booking: bookingId,
      p_order: orderId,
      p_payment: paymentId,
      p_signature: signature
    });

    if (error) {
      throw error;
    }

    // Check if email already sent
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('email_sent, user_id, booking_code, total_amount')
      .eq('id', bookingId)
      .single();

    if (booking && !booking.email_sent) {
      try {
        const fullDetails = await this.getBookingDetails({
          bookingId,
          userId: booking.user_id,
          isAdmin: true
        });

        const showDate = new Date(fullDetails.shows.starts_at).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        const showTime = new Date(fullDetails.shows.starts_at).toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const seatsFormatted = (fullDetails.booking_seats || []).map((bs) => ({
          row_label: bs.seat.row_label,
          seat_number: bs.seat.seat_number,
          category: bs.seat.category
        }));

        if (fullDetails.customerEmail) {
          const emailRes = await emailService.sendBookingConfirmation({
            to: fullDetails.customerEmail,
            bookingData: {
              bookingCode: fullDetails.booking_code,
              movieTitle: fullDetails.shows.movie.title,
              language: fullDetails.shows.language,
              format: fullDetails.shows.format,
              theatreName: fullDetails.shows.screen.theatre.name,
              theatreAddress: `${fullDetails.shows.screen.theatre.address}, ${fullDetails.shows.screen.theatre.city}`,
              screenName: fullDetails.shows.screen.name,
              showDate,
              showTime,
              seats: seatsFormatted,
              totalAmount: fullDetails.total_amount,
              paymentId
            }
          });

          if (emailRes.success) {
            await supabaseAdmin
              .from('bookings')
              .update({ email_sent: true })
              .eq('id', bookingId);
          }
        }
      } catch (emailErr) {
        console.error('[EMAIL RETRY QUEUED] Failed to send booking confirmation email:', emailErr);
      }
    }

    return confirmResult;
  },

  async cancelBooking({ bookingId, userId }) {
    // 1. Validate and execute cancel_booking SQL procedure
    const { data, error } = await supabaseAdmin.rpc('cancel_booking', {
      p_booking: bookingId,
      p_user: userId
    });

    if (error) {
      throw new Error(error.message);
    }

    // 2. Fetch payment record to initiate Razorpay refund
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, razorpay_payment_id, amount')
      .eq('booking_id', bookingId)
      .eq('status', 'PAID')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let refundId = null;

    if (payment && payment.razorpay_payment_id) {
      try {
        const refund = await razorpayInstance.payments.refund(payment.razorpay_payment_id, {
          amount: Math.round(payment.amount * 100),
          notes: { booking_id: bookingId, reason: 'Customer requested cancellation' }
        });

        refundId = refund.id;

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'REFUNDED',
            refund_id: refund.id
          })
          .eq('id', payment.id);
      } catch (refundErr) {
        console.error('[RAZORPAY REFUND ERROR]', refundErr);
        // Note: Booking remains cancelled in DB, manual reconciliation can process refund if gateway rejected
      }
    }

    // 3. Send cancellation email
    try {
      const fullDetails = await this.getBookingDetails({
        bookingId,
        userId,
        isAdmin: true
      });

      const seatsFormatted = (fullDetails.booking_seats || []).map((bs) => ({
        row_label: bs.seat.row_label,
        seat_number: bs.seat.seat_number
      }));

      if (fullDetails.customerEmail) {
        await emailService.sendBookingCancellation({
          to: fullDetails.customerEmail,
          cancellationData: {
            bookingCode: fullDetails.booking_code,
            movieTitle: fullDetails.shows.movie.title,
            theatreName: fullDetails.shows.screen.theatre.name,
            seats: seatsFormatted,
            refundAmount: fullDetails.total_amount,
            refundId
          }
        });
      }
    } catch (emailErr) {
      console.error('[CANCELLATION EMAIL ERROR]', emailErr);
    }

    return {
      status: 'CANCELLED',
      bookingId,
      refundId,
      refundAmount: data.amount
    };
  }
};
