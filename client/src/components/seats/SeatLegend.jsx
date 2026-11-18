import React from 'react';
import './SeatLegend.css';

export default function SeatLegend({ priceByCategory = {} }) {
  let parsed = priceByCategory;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch {}
  }
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch {}
  }
  if (!parsed || typeof parsed !== 'object') {
    parsed = { Standard: 220, Premium: 350, Recliner: 550 };
  }

  // Filter only valid categories with positive numeric prices
  const orderMap = { standard: 1, classic: 1, premium: 2, club: 2, recliner: 3, vip: 3 };
  const validEntries = Object.entries(parsed)
    .filter(([cat, price]) => {
      const p = Number(price);
      return !isNaN(p) && p > 0 && cat.length > 1;
    })
    .sort(([a], [b]) => (orderMap[a.toLowerCase()] || 9) - (orderMap[b.toLowerCase()] || 9));

  return (
    <div className="seat-legend-root">
      {/* Status Legend */}
      <div className="legend-statuses">
        <div className="legend-item">
          <div className="legend-sample sample-available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-sample sample-selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-sample sample-held" />
          <span>Held</span>
        </div>
        <div className="legend-item">
          <div className="legend-sample sample-booked" />
          <span>Booked</span>
        </div>
      </div>

      {/* Category Pricing Legend */}
      {validEntries.length > 0 && (
        <div className="legend-categories">
          {validEntries.map(([cat, price]) => (
            <div key={cat} className="legend-cat-item">
              <span className={`cat-indicator cat-${cat.toLowerCase()}`} />
              <span className="cat-name">{cat}:</span>
              <span className="cat-price">₹{price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
