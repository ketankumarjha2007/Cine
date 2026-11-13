import React from 'react';
import { formatTimeIST, formatCurrency } from '../../utils/format.js';
import './ShowTimeChip.css';

export default function ShowTimeChip({ show, onSelect }) {
  if (!show) return null;

  const startsAt = new Date(show.starts_at);
  const isStarted = startsAt.getTime() <= Date.now();

  const prices = Object.values(show.price_by_category || {});
  const minPrice = prices.length > 0 ? Math.min(...prices) : 200;

  return (
    <button
      type="button"
      className={`show-time-chip ${isStarted ? 'disabled' : ''}`}
      disabled={isStarted}
      onClick={() => !isStarted && onSelect(show)}
      title={isStarted ? 'Show has already commenced' : `Book for ${formatTimeIST(show.starts_at)}`}
    >
      <div className="chip-time">{formatTimeIST(show.starts_at)}</div>
      <div className="chip-details">
        <span className="chip-format">{show.format}</span>
        <span className="chip-price">{formatCurrency(minPrice)}</span>
      </div>
    </button>
  );
}
