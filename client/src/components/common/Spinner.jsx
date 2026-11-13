import React from 'react';
import './Spinner.css';

export default function Spinner({ size = 'md', color = 'primary', className = '' }) {
  return (
    <div
      className={`spinner spinner-${size} spinner-${color} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
