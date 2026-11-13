import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useBooking } from '../context/BookingContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/common/Button.jsx';
import CountdownTimer from '../components/booking/CountdownTimer.jsx';
import PriceBreakdown from '../components/booking/PriceBreakdown.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { formatDateIST, formatTimeIST } from '../utils/format.js';
import './Checkout.css';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeBooking, getAttendeesForBooking } = useBooking();
  const attendees = getAttendeesForBooking(bookingId) || activeBooking?.attendees || [];

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Fetch Booking Details
  useEffect(() => {
    async function fetchBookingDetails() {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingId}`);
        const data = res.data.booking;

        if (data.status !== 'PENDING') {
          if (data.status === 'CONFIRMED') {
            navigate(`/confirmation/${bookingId}`, { replace: true });
            return;
          } else {
            alert('This seat reservation has expired or was cancelled.');
            navigate(`/seats/${data.shows?.id || ''}`, { replace: true });
            return;
          }
        }

        setBooking(data);
      } catch (err) {
        console.error('[LOAD BOOKING ERROR]', err);
        alert(`Failed to load booking: ${err.message}`);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId, navigate]);

  // Handle countdown expiration
  const handleHoldExpired = async () => {
    try {
      await api.post(`/bookings/${bookingId}/release`);
    } catch (e) {
      console.warn('[RELEASE WARN]', e);
    }
    alert('Your seat hold has expired. Please select your seats again.');
    if (booking?.shows?.id) {
      navigate(`/seats/${booking.shows.id}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handlePay = async () => {
    setPaymentError('');
    setPaying(true);

    try {
      // 1. Create order on server
      const orderRes = await api.post('/payments/create-order', { bookingId });
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay Checkout modal
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'CineTicket',
        description: `Movie Tickets: ${booking.shows?.movie?.title}`,
        order_id: orderId,
        prefill: {
          name: profile?.full_name || user?.email?.split('@')[0] || 'Movie Goer',
          email: user?.email || '',
          contact: profile?.phone || ''
        },
        theme: {
          color: '#E11D48'
        },
        handler: async function (response) {
          try {
            // 3. Verify payment signature on server
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // 4. Navigate to Confirmation
            navigate(`/confirmation/${bookingId}`, { replace: true });
          } catch (verifyErr) {
            console.error('[VERIFY ERROR]', verifyErr);
            setPaymentError(`Payment confirmation error: ${verifyErr.message}`);
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setPaymentError('Payment window was closed. Your seat hold is still active until the countdown expires.');
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please refresh and check your internet connection.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResponse) {
        setPaying(false);
        setPaymentError(`Payment failed: ${failResponse.error?.description || 'Transaction declined'}. You can retry.`);
      });
      rzp.open();
    } catch (err) {
      console.error('[PAY ERROR]', err);
      setPaymentError(err.message || 'Failed to initiate payment.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="checkout-loader-box">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  if (!booking) return null;

  const movie = booking.shows?.movie;
  const theatre = booking.shows?.screen?.theatre;
  const screen = booking.shows?.screen;
  const seats = booking.booking_seats || [];

  return (
    <PageShell showFooter={false}>
      <div className="container checkout-page-container">
        {/* Header with countdown */}
        <div className="checkout-header-row">
          <div>
            <h1 className="checkout-page-title">Order Checkout</h1>
            <p className="checkout-page-subtitle">Review booking summary and complete secure payment</p>
          </div>

          <CountdownTimer
            expiresAt={booking.hold_expires_at}
            onExpire={handleHoldExpired}
          />
        </div>

        {paymentError && (
          <div className="checkout-error-box" role="alert">
            <AlertCircle size={20} className="error-icon" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="checkout-grid">
          {/* Left Column: Film & Cinema Summary */}
          <div className="checkout-details-column">
            <div className="checkout-card">
              <h2 className="card-section-title">Screening Details</h2>

              <div className="checkout-movie-info">
                {movie?.poster_url && (
                  <img src={movie.poster_url} alt={movie.title} className="checkout-poster" />
                )}
                <div>
                  <h3 className="checkout-movie-name">{movie?.title}</h3>
                  <p className="checkout-sub-text">
                    {booking.shows?.language} • {booking.shows?.format} • {movie?.certificate || 'UA'}
                  </p>
                  <p className="checkout-duration">{movie?.duration_minutes} minutes runtime</p>
                </div>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-venue-info">
                <p className="venue-name"><strong>Cinema:</strong> {theatre?.name}</p>
                <p className="venue-address">{theatre?.address}, {theatre?.city}</p>
                <p className="venue-time">
                  <strong>Show:</strong> {screen?.name} on {formatDateIST(booking.shows?.starts_at)} at {formatTimeIST(booking.shows?.starts_at)} IST
                </p>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-seats-info">
                <span className="seats-heading">Selected Seats ({seats.length})</span>
                <div className="checkout-seats-tags">
                  {seats.map((bs) => (
                    <span key={bs.id} className="seat-summary-tag">
                      Row {bs.seat?.row_label} - Seat {bs.seat?.seat_number} ({bs.seat?.category})
                    </span>
                  ))}
                </div>
              </div>

              {attendees.length > 0 && (
                <>
                  <div className="checkout-divider" />
                  <div className="checkout-members-info">
                    <span className="seats-heading">Attending Members ({attendees.length})</span>
                    <div className="checkout-members-list">
                      {attendees.map((att, idx) => (
                        <div key={idx} className="checkout-member-item">
                          <span className="member-name-tag">
                            <strong>{att.name || `Member ${idx + 1}`}</strong>
                            {att.age ? ` (${att.age} yrs)` : ''}
                            {att.gender && att.gender !== 'Not Specified' ? ` • ${att.gender}` : ''}
                          </span>
                          <span className="member-seat-badge">{att.seatLabel || `Seat ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cancellation Policy Notice */}
            <div className="cancellation-policy-card">
              <div className="policy-header">
                <ShieldCheck size={18} className="shield-icon" />
                <h4 className="policy-title">Cancellation & Refund Policy</h4>
              </div>
              <p className="policy-text">
                Confirmed tickets can be cancelled before the scheduled show start time directly through My Bookings. 100% of ticket amount will be refunded to your original payment source within 5-7 business days.
              </p>
            </div>
          </div>

          {/* Right Column: Price Breakdown & Pay CTA */}
          <div className="checkout-action-column">
            <PriceBreakdown
              subtotal={booking.subtotal}
              convenienceFee={booking.convenience_fee}
              total={booking.total_amount}
              seatsCount={seats.length}
            />

            <div className="pay-action-box">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={CreditCard}
                onClick={handlePay}
                loading={paying}
              >
                Pay with Razorpay
              </Button>
              <p className="secure-payment-notice">
                <ShieldCheck size={14} />
                <span>256-bit SSL encrypted test payment gateway</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
