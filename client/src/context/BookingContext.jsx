import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [activeBooking, setActiveBooking] = useState(() => {
    try {
      const saved = localStorage.getItem('cineticket_active_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedShow, setSelectedShow] = useState(() => {
    try {
      const saved = localStorage.getItem('cineticket_selected_show');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [attendees, setAttendees] = useState([]);

  // Auto-sync activeBooking and selectedShow to localStorage
  useEffect(() => {
    if (activeBooking) {
      try {
        localStorage.setItem('cineticket_active_booking', JSON.stringify(activeBooking));
      } catch {}
    } else {
      localStorage.removeItem('cineticket_active_booking');
    }
  }, [activeBooking]);

  useEffect(() => {
    if (selectedShow) {
      try {
        localStorage.setItem('cineticket_selected_show', JSON.stringify(selectedShow));
      } catch {}
    } else {
      localStorage.removeItem('cineticket_selected_show');
    }
  }, [selectedShow]);

  // Synchronize attendees with selectedSeats count
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setAttendees([]);
      return;
    }

    setAttendees((prev) => {
      return selectedSeats.map((seat, index) => {
        const existing = prev[index];
        return {
          id: seat.seat_id,
          seatLabel: `Row ${seat.row_label}-${seat.seat_number}`,
          category: seat.category,
          price: seat.price,
          name: existing?.name || (index === 0 ? '' : `Member ${index + 1}`),
          age: existing?.age || '',
          gender: existing?.gender || 'Not Specified'
        };
      });
    });
  }, [selectedSeats]);

  const updateAttendee = (index, field, value) => {
    setAttendees((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const saveAttendeesForBooking = (bookingId, attendeeList) => {
    if (!bookingId) return;
    try {
      localStorage.setItem(`cineticket_attendees_${bookingId}`, JSON.stringify(attendeeList));
    } catch {}
  };

  const getAttendeesForBooking = (bookingId) => {
    if (!bookingId) return [];
    try {
      const data = localStorage.getItem(`cineticket_attendees_${bookingId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const clearBooking = () => {
    setActiveBooking(null);
    setSelectedShow(null);
    setSelectedSeats([]);
    setAttendees([]);
    try {
      localStorage.removeItem('cineticket_active_booking');
      localStorage.removeItem('cineticket_selected_show');
    } catch {}
  };

  const value = {
    activeBooking,
    setActiveBooking,
    selectedShow,
    setSelectedShow,
    selectedSeats,
    setSelectedSeats,
    attendees,
    setAttendees,
    updateAttendee,
    saveAttendeesForBooking,
    getAttendeesForBooking,
    clearBooking
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
