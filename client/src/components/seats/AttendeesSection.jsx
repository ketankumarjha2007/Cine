import React from 'react';
import { Users, User, Trash2, Plus, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/format.js';
import Button from '../common/Button.jsx';
import './AttendeesSection.css';

export default function AttendeesSection({
  attendees = [],
  selectedSeats = [],
  onUpdateAttendee,
  onRemoveSeat,
  onSelectMoreSeats
}) {
  if (selectedSeats.length === 0) return null;

  const totalPrice = selectedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0);

  return (
    <div className="attendees-section-root">
      <div className="attendees-header-bar">
        <div className="attendees-header-title">
          <Users size={18} className="attendees-title-icon" />
          <div>
            <h3 className="attendees-main-heading">Moviegoers & Member Information</h3>
            <p className="attendees-sub-heading">
              Provide names and details for everyone attending this screening ({selectedSeats.length} {selectedSeats.length === 1 ? 'member' : 'members'})
            </p>
          </div>
        </div>

        <div className="attendees-price-summary-pill">
          <span className="price-label">Total Amount:</span>
          <span className="price-value">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <div className="attendees-cards-grid">
        {attendees.map((attendee, index) => {
          const seat = selectedSeats[index];
          if (!seat) return null;

          return (
            <div key={seat.seat_id} className="attendee-card">
              <div className="attendee-card-top">
                <div className="attendee-badge-row">
                  <span className="attendee-number-badge">
                    <User size={12} />
                    <span>Member {index + 1} {index === 0 ? '(Primary)' : ''}</span>
                  </span>
                  <span className={`attendee-seat-chip chip-${seat.category?.toLowerCase()}`}>
                    Row {seat.row_label}-{seat.seat_number} ({seat.category}) • {formatCurrency(seat.price)}
                  </span>
                </div>

                <button
                  type="button"
                  className="attendee-remove-btn"
                  onClick={() => onRemoveSeat(seat)}
                  title="Remove this seat and member"
                  aria-label={`Remove Member ${index + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="attendee-fields-row">
                <div className="attendee-field name-field">
                  <label className="attendee-field-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    value={attendee.name || ''}
                    onChange={(e) => onUpdateAttendee(index, 'name', e.target.value)}
                    placeholder={index === 0 ? 'Your full name' : `Member ${index + 1} full name`}
                    className="attendee-input"
                  />
                </div>

                <div className="attendee-field age-field">
                  <label className="attendee-field-label">
                    Age <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="110"
                    value={attendee.age || ''}
                    onChange={(e) => onUpdateAttendee(index, 'age', e.target.value)}
                    placeholder="Age"
                    className="attendee-input"
                  />
                </div>

                <div className="attendee-field gender-field">
                  <label className="attendee-field-label">Gender</label>
                  <select
                    value={attendee.gender || 'Not Specified'}
                    onChange={(e) => onUpdateAttendee(index, 'gender', e.target.value)}
                    className="attendee-input select-input"
                  >
                    <option value="Not Specified">Not Specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="attendees-footer-action">
        <p className="attendees-hint-text">
          Want to bring more friends or family? Select additional seats on the auditorium map above to add members.
        </p>
      </div>
    </div>
  );
}
