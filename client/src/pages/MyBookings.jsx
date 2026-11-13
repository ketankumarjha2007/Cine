import React, { useState, useEffect } from 'react';
import { Ticket, Download, XCircle, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import api from '../services/api.js';
import { generateBill } from '../utils/generateBill.js';
import { formatDateIST, formatTimeIST, formatCurrency } from '../utils/format.js';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, cancelled
  const [downloadingId, setDownloadingId] = useState(null);

  // Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/me');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('[FETCH MY BOOKINGS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const nowMs = Date.now();

  const upcomingBookings = bookings.filter((b) => {
    if (b.status !== 'CONFIRMED') return false;
    const showStart = new Date(b.shows?.starts_at).getTime();
    return showStart > nowMs;
  });

  const pastBookings = bookings.filter((b) => {
    if (b.status === 'CANCELLED') return false;
    const showStart = new Date(b.shows?.starts_at).getTime();
    return b.status === 'CONFIRMED' && showStart <= nowMs;
  });

  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const displayedList =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastBookings
      : cancelledBookings;

  const handleDownload = async (booking) => {
    try {
      setDownloadingId(booking.id);
      // Fetch full details if needed
      const res = await api.get(`/bookings/${booking.id}`);
      await generateBill(res.data.booking);
    } catch (err) {
      alert(`Could not download bill: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancelError('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    setCancelError('');

    try {
      await api.post(`/bookings/${bookingToCancel.id}/cancel`);
      setCancelModalOpen(false);
      fetchUserBookings();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageShell>
      <div className="container my-bookings-page-container">
        <div className="my-bookings-header">
          <h1 className="my-bookings-title">My Bookings</h1>
          <p className="my-bookings-subtitle">
            Manage your cinema ticket reservations, download tax bills, or cancel upcoming shows
          </p>
        </div>

        {/* Status Tabs */}
        <div className="bookings-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`booking-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`booking-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastBookings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            className={`booking-tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="bookings-loading-box">
            <Spinner size="lg" />
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            title="No Bookings in this Section"
            description={
              activeTab === 'upcoming'
                ? 'You do not have any upcoming movie shows reserved.'
                : activeTab === 'past'
                ? 'No past completed movie visits on record.'
                : 'You have not cancelled any bookings.'
            }
            icon={Ticket}
          />
        ) : (
          <div className="bookings-cards-list">
            {displayedList.map((b) => {
              const movie = b.shows?.movie;
              const screen = b.shows?.screen;
              const theatre = b.shows?.screen?.theatre;
              const showTimeMs = new Date(b.shows?.starts_at).getTime();
              const canCancel = b.status === 'CONFIRMED' && showTimeMs > nowMs;

              const seatPills = (b.booking_seats || []).map((bs) =>
                `${bs.seat?.row_label}${bs.seat?.seat_number}`
              ).join(', ');

              return (
                <div key={b.id} className="user-booking-card">
                  <div className="user-booking-left">
                    {movie?.poster_url && (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="user-booking-poster"
                        loading="lazy"
                      />
                    )}
                    <div className="user-booking-info">
                      <div className="booking-top-row">
                        <span className="user-booking-code">{b.booking_code}</span>
                        <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'danger'}>
                          {b.status}
                        </Badge>
                      </div>

                      <h3 className="user-booking-movie-title">{movie?.title}</h3>
                      <p className="user-booking-theatre">
                        {theatre?.name} - {screen?.name} ({theatre?.city})
                      </p>

                      <div className="user-booking-meta-row">
                        <span><Calendar size={13} /> {formatDateIST(b.shows?.starts_at)}</span>
                        <span><Clock size={13} /> {formatTimeIST(b.shows?.starts_at)} IST</span>
                        <span className="user-booking-seats-text">Seats: <strong>{seatPills || '—'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="user-booking-right">
                    <div className="user-booking-price-box">
                      <span className="price-label">Total Amount</span>
                      <span className="price-amount">{formatCurrency(b.total_amount)}</span>
                    </div>

                    <div className="user-booking-actions">
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownload(b)}
                          loading={downloadingId === b.id}
                        >
                          Download Bill
                        </Button>
                      )}

                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleOpenCancelModal(b)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Ticket Reservation"
          maxWidth="500px"
        >
          {bookingToCancel && (
            <div className="cancel-confirm-dialog">
              <div className="cancel-warning-banner">
                <AlertTriangle size={24} className="cancel-warning-icon" />
                <p className="cancel-warning-text">
                  Are you sure you want to cancel your tickets for <strong>{bookingToCancel.shows?.movie?.title}</strong>?
                </p>
              </div>

              {cancelError && (
                <div className="auth-error-alert" role="alert">
                  {cancelError}
                </div>
              )}

              <div className="cancel-summary-box">
                <div className="cancel-line">
                  <span>Booking Code:</span>
                  <strong>{bookingToCancel.booking_code}</strong>
                </div>
                <div className="cancel-line">
                  <span>Showtime:</span>
                  <span>{formatDateIST(bookingToCancel.shows?.starts_at)} at {formatTimeIST(bookingToCancel.shows?.starts_at)} IST</span>
                </div>
                <div className="cancel-line">
                  <span>Refund Amount:</span>
                  <strong className="refund-highlight">{formatCurrency(bookingToCancel.total_amount)}</strong>
                </div>
              </div>

              <p className="refund-terms-note">
                The full refund amount will be credited to your original payment method in 5-7 business days. Your reserved seats will be released immediately.
              </p>

              <div className="modal-actions-footer">
                <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
                  Keep Booking
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmCancellation}
                  loading={cancelling}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageShell>
  );
}
