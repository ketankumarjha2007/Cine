import React from 'react';
import { formatCurrency } from '../../utils/format.js';
import './Seat.css';

export default function Seat({
  seat, // { seat_id, row_label, seat_number, category, price, status: 'available'|'held'|'booked' }
  isSelected,
  onToggle
}) {
  const isAvailable = seat.status === 'available';
  const isHeld = seat.status === 'held';
  const isBooked = seat.status === 'booked';

  let statusClass = 'available';
  if (isSelected) statusClass = 'selected';
  else if (isHeld) statusClass = 'held';
  else if (isBooked) statusClass = 'booked';

  const accessibleLabel = `Row ${seat.row_label}, seat ${seat.seat_number}, ${seat.category}, ${formatCurrency(seat.price, false)}, ${isSelected ? 'selected' : seat.status}`;

  const handleClick = () => {
    if (isAvailable || isSelected) {
      onToggle(seat);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && (isAvailable || isSelected)) {
      e.preventDefault();
      onToggle(seat);
    }
  };

  return (
    <button
      type="button"
      className={`seat-item seat-${statusClass} seat-cat-${seat.category?.toLowerCase()}`}
      disabled={!isAvailable && !isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      title={`${seat.row_label}${seat.seat_number} - ${seat.category} (${formatCurrency(seat.price)}) [${seat.status}]`}
    >
      <span className="seat-number-label">{seat.seat_number}</span>
    </button>
  );
}
