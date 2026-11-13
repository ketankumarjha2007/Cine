import React from 'react';
import Seat from './Seat.jsx';
import './SeatMap.css';

export default function SeatMap({
  seats = [], // array from get_show_seats RPC
  selectedSeats = [],
  onToggleSeat
}) {
  // Group seats by category and then by row
  // Sort rows alphabetically
  const rowsMap = new Map();

  seats.forEach((seat) => {
    const rowKey = seat.row_label;
    if (!rowsMap.has(rowKey)) {
      rowsMap.set(rowKey, {
        rowLabel: rowKey,
        category: seat.category,
        seats: []
      });
    }
    rowsMap.get(rowKey).seats.push(seat);
  });

  // Sort rows A, B, C...
  const sortedRows = Array.from(rowsMap.values()).sort((a, b) =>
    a.rowLabel.localeCompare(b.rowLabel)
  );

  // Group into category sections
  const categorySectionsMap = new Map();
  sortedRows.forEach((row) => {
    // Sort seats in row by seat_number
    row.seats.sort((a, b) => a.seat_number - b.seat_number);

    if (!categorySectionsMap.has(row.category)) {
      categorySectionsMap.set(row.category, []);
    }
    categorySectionsMap.get(row.category).push(row);
  });

  const selectedSeatIds = new Set(selectedSeats.map((s) => s.seat_id));

  return (
    <div className="seat-map-wrapper">
      {/* Screen Curved Indicator */}
      <div className="seat-screen-indicator-box">
        <div className="seat-screen-arc" />
        <span className="seat-screen-label">ALL EYES THIS WAY • SCREEN</span>
      </div>

      {/* Auditorium Seating Area with Horizontal Scroll on Mobile */}
      <div className="seat-map-scroll-area">
        <div className="seat-map-container" role="grid" aria-label="Auditorium Seating Matrix">
          {Array.from(categorySectionsMap.entries()).map(([catName, rows]) => {
            const samplePrice = rows[0]?.seats[0]?.price || 200;
            return (
              <div key={catName} className="seat-category-tier-section">
                <div className="category-tier-heading">
                  <span className="tier-name">{catName} Tier</span>
                  <span className="tier-price">INR {samplePrice}</span>
                </div>

                <div className="category-rows-group">
                  {rows.map((row) => (
                    <div key={row.rowLabel} className="seat-row" role="row">
                      <span className="seat-row-label left" aria-hidden="true">
                        {row.rowLabel}
                      </span>

                      <div className="seat-row-cells">
                        {row.seats.map((st, sIdx) => {
                          // Aisle gap after every 6 seats if row has more than 10 seats
                          const addAisle = (sIdx + 1) % 6 === 0 && sIdx + 1 < row.seats.length;
                          return (
                            <React.Fragment key={st.seat_id}>
                              <Seat
                                seat={st}
                                isSelected={selectedSeatIds.has(st.seat_id)}
                                onToggle={onToggleSeat}
                              />
                              {addAisle && <div className="seat-aisle-spacer" aria-hidden="true" />}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <span className="seat-row-label right" aria-hidden="true">
                        {row.rowLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
