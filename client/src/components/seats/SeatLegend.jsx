import React from 'react';
import './SeatLegend.css';

export default function SeatLegend({ priceByCategory = {} }) {
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
      {Object.keys(priceByCategory).length > 0 && (
        <div className="legend-categories">
          {Object.entries(priceByCategory).map(([cat, price]) => (
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
