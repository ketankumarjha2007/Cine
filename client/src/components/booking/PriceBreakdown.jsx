import React from 'react';
import { formatCurrency } from '../../utils/format.js';
import './PriceBreakdown.css';

export default function PriceBreakdown({
  subtotal = 0,
  convenienceFee = 0,
  total = 0,
  seatsCount = 1
}) {
  const feeNum = Number(convenienceFee) || 0;

  return (
    <div className="price-breakdown-card">
      <h3 className="breakdown-card-title">Order Summary</h3>

      <div className="breakdown-lines-list">
        <div className="breakdown-line">
          <span className="line-label">Ticket Subtotal ({seatsCount} {seatsCount === 1 ? 'ticket' : 'tickets'})</span>
          <span className="line-val">{formatCurrency(subtotal)}</span>
        </div>

        {feeNum > 0 && (
          <div className="breakdown-line">
            <span className="line-label">Convenience Fee</span>
            <span className="line-val">{formatCurrency(feeNum)}</span>
          </div>
        )}

        <div className="breakdown-divider" />

        <div className="breakdown-line total-line">
          <span className="total-label">Amount Payable</span>
          <span className="total-val">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
