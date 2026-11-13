import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const clearBooking = () => {
    setActiveBooking(null);
    setSelectedShow(null);
    setSelectedSeats([]);
  };

  const value = {
    activeBooking,
    setActiveBooking,
    selectedShow,
    setSelectedShow,
    selectedSeats,
    setSelectedSeats,
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
