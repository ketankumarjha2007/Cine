import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Film, MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import { formatDateIST, formatTimeIST, formatCurrency } from '../../utils/format.js';
import './TicketCard.css';

export default function TicketCard({ booking }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (booking?.booking_code) {
      QRCode.toDataURL(booking.booking_code, {
        margin: 1,
        width: 140,
        color: {
          dark: '#14141C',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [booking?.booking_code]);

  if (!booking) return null;

  const movie = booking.shows?.movie;
  const theatre = booking.shows?.screen?.theatre;
  const screen = booking.shows?.screen;
  const seatsFormatted = (booking.booking_seats || [])
    .map((bs) => `${bs.seat?.row_label}${bs.seat?.seat_number}`)
    .join(', ');

  return (
    <div className="ticket-card-root">
      {/* Top Punch Notch Header */}
      <div className="ticket-card-header">
        <div className="ticket-header-brand">
          <Film size={20} className="ticket-brand-icon" />
          <span>CineTicket Digital Pass</span>
        </div>
        <span className="ticket-code-tag">{booking.booking_code}</span>
      </div>

      {/* Main Ticket Content */}
      <div className="ticket-card-body">
        <div className="ticket-movie-title-box">
          <h2 className="ticket-movie-title">{movie?.title || 'Movie'}</h2>
          <span className="ticket-movie-meta">
            {booking.shows?.language} • {booking.shows?.format} • {movie?.certificate || 'UA'}
          </span>
        </div>

        <div className="ticket-info-grid">
          <div className="ticket-info-item">
            <span className="info-label">Cinema</span>
            <span className="info-value">{theatre?.name}</span>
            <span className="info-sub">{theatre?.address}, {theatre?.city}</span>
          </div>

          <div className="ticket-info-item">
            <span className="info-label">Screen & Showtime</span>
            <span className="info-value">{screen?.name}</span>
            <span className="info-sub">
              {formatDateIST(booking.shows?.starts_at)} at {formatTimeIST(booking.shows?.starts_at)} IST
            </span>
          </div>
        </div>

        <div className="ticket-seats-row">
          <div className="ticket-seats-box">
            <span className="info-label">Allocated Seats</span>
            <span className="ticket-seats-list">{seatsFormatted || '—'}</span>
          </div>

          <div className="ticket-amount-box">
            <span className="info-label">Total Amount Paid</span>
            <span className="ticket-amount-val">{formatCurrency(booking.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Tear Line with Left and Right Cutouts */}
      <div className="ticket-tear-line">
        <div className="ticket-notch notch-left" />
        <div className="ticket-dash-line" />
        <div className="ticket-notch notch-right" />
      </div>

      {/* QR Code Barcode Footer */}
      <div className="ticket-card-footer">
        <div className="ticket-qr-box">
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="Scan QR Code" className="ticket-qr-img" />
          )}
        </div>
        <div className="ticket-qr-instructions">
          <span className="qr-title">Scan at Cinema Entrance</span>
          <span className="qr-sub">Show this digital barcode directly on your mobile device</span>
        </div>
      </div>
    </div>
  );
}
