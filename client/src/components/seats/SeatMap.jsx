import React from 'react';
import Seat from './Seat.jsx';
import { Sparkles, Crown } from 'lucide-react';
import './SeatMap.css';

export default function SeatMap({
  seats = [], // array from get_show_seats RPC
  selectedSeats = [],
  onToggleSeat
}) {
  // Group seats by category and then by row
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

  // Group into category sections ordered from Screen (top) to Back (bottom):
  // 1. Standard (closest to the screen, affordable)
  // 2. Premium (optimal middle view)
  // 3. Recliner / VIP (farthest from screen, luxury back-row experience)
  const categoryOrder = {
    'Standard': 1,
    'Classic': 1,
    'Executive': 1,
    'Premium': 2,
    'Club': 2,
    'Recliner': 3,
    'VIP': 3,
    'Prime': 3
  };
  const categorySectionsMap = new Map();

  sortedRows.forEach((row) => {
    row.seats.sort((a, b) => a.seat_number - b.seat_number);

    if (!categorySectionsMap.has(row.category)) {
      categorySectionsMap.set(row.category, []);
    }
    categorySectionsMap.get(row.category).push(row);
  });

  const sortedCategories = Array.from(categorySectionsMap.entries()).sort(
    ([catA], [catB]) => (categoryOrder[catA] || 99) - (categoryOrder[catB] || 99)
  );

  const selectedSeatIds = new Set(selectedSeats.map((s) => s.seat_id));

  return (
    <div className="theatre-stage-wrapper">
      {/* Realistic 3D Curved Cinema Screen */}
      <div className="theatre-screen-perspective">
        <div className="theatre-projector-beam" />
        <div className="theatre-curved-screen-bar">
          <div className="theatre-screen-glow-line" />
          <div className="theatre-screen-canvas">
            <span className="theatre-screen-text">CURVED AUDITORIUM SCREEN • ALL EYES THIS WAY</span>
          </div>
        </div>
      </div>

      {/* Auditorium Seating Floor with Horizontal Pan for Mobile */}
      <div className="theatre-seating-floor-scroll">
        <div className="theatre-seating-matrix" role="grid" aria-label="Auditorium Seating Matrix">
          {sortedCategories.map(([catName, rows]) => {
            const rawPrice = Number(rows[0]?.seats[0]?.price);
            const samplePrice = (!isNaN(rawPrice) && rawPrice > 0)
              ? rawPrice
              : (catName.toLowerCase() === 'recliner' ? 550 : catName.toLowerCase() === 'vip' ? 500 : catName.toLowerCase() === 'premium' ? 350 : 220);
            const isVip = catName.toLowerCase() === 'vip';

            return (
              <div key={catName} className={`theatre-tier-section tier-${catName.toLowerCase()}`}>
                <div className="theatre-tier-header">
                  <div className="tier-header-left">
                    {isVip ? (
                      <Crown size={14} className="tier-vip-icon" />
                    ) : (
                      <Sparkles size={13} className="tier-icon" />
                    )}
                    <span className="tier-title">{catName} Tier</span>
                    {isVip && <span className="tier-pill-badge">Plush Recliners</span>}
                  </div>
                  <span className="tier-price-badge">INR {samplePrice}</span>
                </div>

                <div className="theatre-tier-rows">
                  {rows.map((row) => (
                    <div key={row.rowLabel} className="theatre-row-line" role="row">
                      {/* Left Row Indicator */}
                      <div className="theatre-row-badge left" aria-hidden="true">
                        {row.rowLabel}
                      </div>

                      {/* Seats in Row */}
                      <div className="theatre-row-seats">
                        {row.seats.map((st, sIdx) => {
                          // Aisle gap every 6 seats if row is wide
                          const addAisle = (sIdx + 1) % 6 === 0 && sIdx + 1 < row.seats.length;
                          return (
                            <React.Fragment key={st.seat_id}>
                              <Seat
                                seat={st}
                                isSelected={selectedSeatIds.has(st.seat_id)}
                                onToggle={onToggleSeat}
                              />
                              {addAisle && (
                                <div className="theatre-aisle-path" aria-hidden="true">
                                  <span className="aisle-marker" />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Right Row Indicator */}
                      <div className="theatre-row-badge right" aria-hidden="true">
                        {row.rowLabel}
                      </div>
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
