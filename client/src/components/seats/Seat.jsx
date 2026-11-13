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

  const categoryLower = seat.category?.toLowerCase() || 'standard';
  const accessibleLabel = `Row ${seat.row_label}, Seat ${seat.seat_number}, ${seat.category} Tier, ${formatCurrency(seat.price, false)}, ${isSelected ? 'Selected' : seat.status}`;

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
      className={`theatre-chair chair-${statusClass} chair-cat-${categoryLower}`}
      disabled={!isAvailable && !isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      title={`${seat.row_label}${seat.seat_number} • ${seat.category} (${formatCurrency(seat.price)}) [${seat.status}]`}
    >
      {/* Visual Realistic Theatre Chair Anatomy */}
      <span className="chair-headrest" aria-hidden="true" />
      <span className="chair-body">
        <span className="chair-armrest left" aria-hidden="true" />
        <span className="chair-cushion">
          <span className="chair-number">{seat.seat_number}</span>
        </span>
        <span className="chair-armrest right" aria-hidden="true" />
      </span>
    </button>
  );
}
