import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';

export function useSeatRealtime(showId) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial seat layout and statuses using get_show_seats RPC
  const fetchSeats = async () => {
    if (!showId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_show_seats', {
        p_show: showId
      });

      if (rpcError) throw rpcError;
      setSeats(data || []);
    } catch (err) {
      console.error('[REALTIME SEAT FETCH ERROR]', err);
      setError(err.message || 'Failed to fetch seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();

    if (!showId) return;

    // Subscribe to booking_seats changes for this show
    const channel = supabase
      .channel(`seats-show-${showId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_seats',
          filter: `show_id=eq.${showId}`
        },
        (payload) => {
          const { new: newRecord, old: oldRecord, eventType } = payload;

          setSeats((prevSeats) => {
            return prevSeats.map((seat) => {
              const targetSeatId = newRecord?.seat_id || oldRecord?.seat_id;
              if (seat.seat_id === targetSeatId) {
                let updatedStatus = 'available';
                if (eventType === 'DELETE' || newRecord?.status === 'RELEASED') {
                  updatedStatus = 'available';
                } else if (newRecord?.status === 'HELD') {
                  updatedStatus = 'held';
                } else if (newRecord?.status === 'BOOKED') {
                  updatedStatus = 'booked';
                }
                return { ...seat, status: updatedStatus };
              }
              return seat;
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId]);

  return {
    seats,
    loading,
    error,
    refreshSeats: fetchSeats
  };
}
