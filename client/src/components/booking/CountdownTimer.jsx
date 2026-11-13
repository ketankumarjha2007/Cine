import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown.js';
import './CountdownTimer.css';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const { secondsLeft, formatted, isExpired } = useCountdown(expiresAt, onExpire);

  const isUrgent = secondsLeft < 120; // less than 2 minutes remaining

  return (
    <div className={`countdown-timer-root ${isUrgent ? 'urgent' : ''}`}>
      {isUrgent ? (
        <AlertTriangle size={18} className="timer-icon alert" />
      ) : (
        <Clock size={18} className="timer-icon" />
      )}
      <div className="timer-text-group">
        <span className="timer-label">Seats Held For:</span>
        <span className="timer-clock">{formatted}</span>
      </div>
    </div>
  );
}
