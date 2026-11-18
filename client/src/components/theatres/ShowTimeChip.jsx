import React from 'react';
import { formatTimeIST, formatCurrency } from '../../utils/format.js';
import './ShowTimeChip.css';

export default function ShowTimeChip({ show, onSelect }) {
  if (!show) return null;

  const startsAt = new Date(show.starts_at);
  const isStarted = startsAt.getTime() <= Date.now();

  let priceObj = show.price_by_category;
  if (typeof priceObj === 'string') {
    try { priceObj = JSON.parse(priceObj); } catch {}
  }
  if (typeof priceObj === 'string') {
    try { priceObj = JSON.parse(priceObj); } catch {}
  }

  const rawPrices = Object.values(priceObj || {});
  const validPrices = rawPrices
    .map((p) => Number(p))
    .filter((n) => !isNaN(n) && n > 0);

  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 220;

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
