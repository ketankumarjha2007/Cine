import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.js';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useBooking } from '../context/BookingContext.jsx';
import { useSeatRealtime } from '../hooks/useSeatRealtime.js';
import PageShell from '../components/layout/PageShell.jsx';
import SeatMap from '../components/seats/SeatMap.jsx';
import SeatLegend from '../components/seats/SeatLegend.jsx';
import BookingSummaryBar from '../components/seats/BookingSummaryBar.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDateIST, formatTimeIST } from '../utils/format.js';
import './SeatSelection.css';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedShow, setSelectedShow, setActiveBooking } = useBooking();

  const [showData, setShowData] = useState(selectedShow);
  const [showLoading, setShowLoading] = useState(!selectedShow);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holding, setHolding] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // Realtime Seat Hook
  const { seats, loading: seatsLoading, refreshSeats } = useSeatRealtime(showId);

  // Load show details if accessed directly via URL
  useEffect(() => {
    async function fetchShow() {
      if (showData) return;
      try {
        setShowLoading(true);
        const { data, error } = await supabase
          .from('shows')
          .select(`
            id,
            starts_at,
            ends_at,
            language,
            format,
            price_by_category,
            movie:movie_id (id, title, certificate, duration_minutes),
            screen:screen_id (id, name, theatre:theatre_id (id, name, address, city))
          `)
          .eq('id', showId)
          .single();

        if (error) throw error;
        setShowData(data);
        setSelectedShow(data);
      } catch (err) {
        console.error('[FETCH SHOW ERROR]', err);
      } finally {
        setShowLoading(false);
      }
    }

    fetchShow();
  }, [showId, showData, setSelectedShow]);

  // Seat toggle handler (Max 10 seats limit)
  const handleToggleSeat = (seat) => {
    setConflictError('');
    const exists = selectedSeats.some((s) => s.seat_id === seat.seat_id);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.seat_id !== seat.seat_id));
    } else {
      if (selectedSeats.length >= 10) {
        setConflictError('Maximum booking limit is 10 seats per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleProceed = async () => {
    if (!user) {
      // Prompt user to sign in
      navigate('/login', { state: { from: { pathname: `/seats/${showId}` } } });
      return;
    }

    if (selectedSeats.length === 0) return;

    setHolding(true);
    setConflictError('');

    try {
      const seatIds = selectedSeats.map((s) => s.seat_id);
      const res = await api.post('/bookings/hold', {
        showId,
        seatIds
      });

      const bookingHold = res.data;
      setActiveBooking({
        ...bookingHold,
        show: showData,
        seats: selectedSeats
      });

      navigate(`/checkout/${bookingHold.bookingId}`);
    } catch (err) {
      console.error('[HOLD ERROR]', err);
      // Conflict or seat no longer available: Refresh seat layout and keep user on the page
      setConflictError(err.message || 'One or more selected seats were just taken. Seat map refreshed.');
      setSelectedSeats([]);
      refreshSeats();
    } finally {
      setHolding(false);
    }
  };

  if (showLoading) {
    return (
      <PageShell>
        <div className="seat-page-loader">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  if (!showData) {
    return (
      <PageShell>
        <div className="container">
          <EmptyState
            title="Screening Unavailable"
            description="The requested showtime could not be located."
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell showFooter={false}>
      <div className="seat-selection-header-bar">
        <div className="container seat-header-container">
          <div className="seat-show-info">
            <h1 className="seat-movie-title">{showData.movie?.title}</h1>
            <p className="seat-theatre-line">
              {showData.screen?.theatre?.name} | {showData.screen?.name} | {showData.language} {showData.format}
            </p>
          </div>
          <div className="seat-show-time-box">
            <span className="seat-show-date">{formatDateIST(showData.starts_at)}</span>
            <span className="seat-show-clock">{formatTimeIST(showData.starts_at)} IST</span>
          </div>
        </div>
      </div>

      <div className="container seat-selection-main">
        {conflictError && (
          <div className="seat-conflict-alert" role="alert">
            {conflictError}
          </div>
        )}

        {/* Legend */}
        <SeatLegend priceByCategory={showData.price_by_category} />

        {/* Seat Map */}
        {seatsLoading ? (
          <div className="seat-map-loading">
            <Spinner size="lg" />
          </div>
        ) : (
          <SeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
          />
        )}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <BookingSummaryBar
        selectedSeats={selectedSeats}
        onProceed={handleProceed}
        loading={holding}
      />
    </PageShell>
  );
}
