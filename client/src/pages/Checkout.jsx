import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowLeft, CreditCard, Users, XCircle } from 'lucide-react';
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
  const { activeBooking, saveAttendeesForBooking, getAttendeesForBooking } = useBooking();

  const [booking, setBooking] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [releasing, setReleasing] = useState(false);
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

        // Initialize attendees for each booked seat
        const existingAttendees = getAttendeesForBooking(bookingId);
        const seatsList = data.booking_seats || [];
        const initial = seatsList.map((bs, idx) => {
          const existing = existingAttendees?.[idx];
          return {
            seatId: bs.seat_id || bs.seat?.id,
            seatLabel: `Row ${bs.seat?.row_label} - Seat ${bs.seat?.seat_number} (${bs.seat?.category})`,
            category: bs.seat?.category,
            price: bs.price,
            name: existing?.name || (idx === 0 ? (profile?.full_name || '') : ''),
            age: existing?.age || '',
            gender: existing?.gender || 'Not Specified'
          };
        });
        setAttendees(initial);
      } catch (err) {
        console.error('[LOAD BOOKING ERROR]', err);
        alert(`Failed to load booking: ${err.message}`);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId, navigate, profile?.full_name]);

  const handleUpdateAttendee = (idx, field, value) => {
    setAttendees((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

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

  // Explicitly release hold and pick other seats
  const handleReleaseAndCancel = async () => {
    if (!window.confirm('Are you sure you want to release these held seats? They will immediately be made available for other users.')) {
      return;
    }
    try {
      setReleasing(true);
      await api.post(`/bookings/${bookingId}/release`);
      const showId = booking?.shows?.id;
      if (showId) {
        navigate(`/seats/${showId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('[RELEASE ERROR]', err);
      navigate('/');
    } finally {
      setReleasing(false);
    }
  };

  const handlePay = async () => {
    setPaymentError('');

    // Validate all attendee fields
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.name || !att.name.trim()) {
        setPaymentError(`Please provide the full name for Member ${i + 1} (${att.seatLabel}).`);
        return;
      }
      if (!att.age || Number(att.age) < 3 || Number(att.age) > 115) {
        setPaymentError(`Please enter a valid age (3 - 115) for Member ${i + 1} (${att.name}).`);
        return;
      }
    }

    // Save attendees locally and persist with booking
    saveAttendeesForBooking(bookingId, attendees);

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
          name: attendees[0]?.name || profile?.full_name || user?.email?.split('@')[0] || 'Movie Goer',
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
            <p className="checkout-page-subtitle">Enter moviegoer details and complete secure payment</p>
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
          {/* Left Column: Film Info & Member Details Forms */}
          <div className="checkout-details-column">
            {/* Screening Details */}
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
                <span className="seats-heading">Reserved Seats ({seats.length})</span>
                <div className="checkout-seats-tags">
                  {seats.map((bs) => (
                    <span key={bs.id} className="seat-summary-tag">
                      Row {bs.seat?.row_label} - Seat {bs.seat?.seat_number} ({bs.seat?.category})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Prominent Member / Attendee Details Card */}
            <div className="checkout-card members-card">
              <div className="card-header-with-badge">
                <div className="card-title-group">
                  <Users size={18} className="section-title-icon" />
                  <h2 className="card-section-title">Ticket Holders & Member Information</h2>
                </div>
                <span className="members-count-badge">
                  {attendees.length} {attendees.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
              <p className="card-section-desc">
                Please enter the details for each person attending this screening. These will be printed on your admission pass and bill.
              </p>

              <div className="checkout-members-forms-list">
                {attendees.map((att, idx) => (
                  <div key={idx} className="checkout-member-form-card">
                    <div className="member-form-header">
                      <span className="member-form-number">
                        Member {idx + 1} {idx === 0 ? '(Primary / You)' : ''}
                      </span>
                      <span className="member-form-seat-tag">
                        {att.seatLabel}
                      </span>
                    </div>

                    <div className="member-form-inputs-grid">
                      <div className="member-input-group name-group">
                        <label className="member-input-label">
                          Full Name <span className="req-dot">*</span>
                        </label>
                        <input
                          type="text"
                          value={att.name}
                          onChange={(e) => handleUpdateAttendee(idx, 'name', e.target.value)}
                          placeholder={idx === 0 ? 'Your full name' : `Member ${idx + 1} full name`}
                          className="member-form-input"
                          required
                        />
                      </div>

                      <div className="member-input-group age-group">
                        <label className="member-input-label">
                          Age <span className="req-dot">*</span>
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="115"
                          value={att.age}
                          onChange={(e) => handleUpdateAttendee(idx, 'age', e.target.value)}
                          placeholder="Age"
                          className="member-form-input"
                          required
                        />
                      </div>

                      <div className="member-input-group gender-group">
                        <label className="member-input-label">Gender</label>
                        <select
                          value={att.gender}
                          onChange={(e) => handleUpdateAttendee(idx, 'gender', e.target.value)}
                          className="member-form-input member-select"
                        >
                          <option value="Not Specified">Not Specified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

              <div className="checkout-release-hold-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  icon={XCircle}
                  onClick={handleReleaseAndCancel}
                  loading={releasing}
                >
                  Release Seats & Choose Different Show
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
