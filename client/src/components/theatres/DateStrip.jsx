import React from 'react';
import './DateStrip.css';

export default function DateStrip({ selectedDate, onSelectDate }) {
  // Generate next 7 days in IST
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const isoDate = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' });

    days.push({
      dateStr: isoDate,
      dayName,
      dayNumber,
      monthName
    });
  }

  return (
    <div className="date-strip-root" role="tablist" aria-label="Show Dates">
      <div className="date-strip-container">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <button
              key={item.dateStr}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`date-chip ${isSelected ? 'date-chip-active' : ''}`}
              onClick={() => onSelectDate(item.dateStr)}
            >
              <span className="date-chip-day-name">{item.dayName}</span>
              <span className="date-chip-day-num">{item.dayNumber}</span>
              <span className="date-chip-month">{item.monthName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
