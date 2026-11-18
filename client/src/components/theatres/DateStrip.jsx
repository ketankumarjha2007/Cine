import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './DateStrip.css';

export default function DateStrip({ selectedDate, onSelectDate, daysCount = 30 }) {
  const scrollRef = useRef(null);
  const today = new Date();

  // Generate rolling schedule days
  const days = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const isoDate = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

    const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' });

    days.push({
      dateStr: isoDate,
      dayName,
      dayNumber,
      monthName,
      isWeekend
    });
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const minDate = days[0]?.dateStr;
  const maxDate = days[days.length - 1]?.dateStr;

  return (
    <div className="date-strip-wrapper">
      <div className="date-strip-header">
        <span className="date-strip-title">
          <CalendarIcon size={14} className="cal-icon" />
          <span>Select Date (Rolling 30-Day Schedule)</span>
        </span>
        <div className="date-strip-nav-actions">
          <button
            type="button"
            className="strip-nav-btn"
            onClick={() => scroll('left')}
            aria-label="Scroll dates left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="strip-nav-btn"
            onClick={() => scroll('right')}
            aria-label="Scroll dates right"
          >
            <ChevronRight size={16} />
          </button>
          <label className="date-picker-label" title="Pick from calendar">
            <input
              type="date"
              className="hidden-date-input"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            />
            <span className="cal-picker-pill">
              <CalendarIcon size={13} />
              <span>Calendar</span>
            </span>
          </label>
        </div>
      </div>

      <div className="date-strip-root" role="tablist" aria-label="Show Dates" ref={scrollRef}>
        <div className="date-strip-container">
          {days.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`date-chip ${isSelected ? 'date-chip-active' : ''} ${item.isWeekend ? 'weekend' : ''}`}
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
    </div>
  );
}
