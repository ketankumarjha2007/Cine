import React from 'react';
import { ArrowRight, Ticket } from 'lucide-react';
import { formatCurrency } from '../../utils/format.js';
import Button from '../common/Button.jsx';
import './BookingSummaryBar.css';

export default function BookingSummaryBar({
  selectedSeats = [],
  onProceed,
  loading = false
}) {
  const count = selectedSeats.length;
  const totalAmount = selectedSeats.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);

  if (count === 0) return null;

  const seatsListString = selectedSeats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .join(', ');

  return (
    <div className="summary-bar-root">
      <div className="container summary-bar-container">
        <div className="summary-left-block">
          <div className="summary-seats-header">
            <Ticket size={16} className="summary-ticket-icon" />
            <span className="summary-count-text">
              {count} {count === 1 ? 'Seat Selected' : 'Seats Selected'}
            </span>
            {count >= 10 && (
              <span className="summary-limit-tag">Maximum Limit Reached</span>
            )}
          </div>
          <div className="summary-seats-pills truncate" title={seatsListString}>
            {seatsListString}
          </div>
        </div>

        <div className="summary-right-block">
          <div className="summary-price-box">
            <span className="summary-price-label">Total Amount</span>
            <span className="summary-price-val">{formatCurrency(totalAmount)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={onProceed}
            loading={loading}
          >
            Add Member Details & Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
