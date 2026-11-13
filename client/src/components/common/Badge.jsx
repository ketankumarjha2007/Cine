import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral', // neutral, primary, success, warning, danger, rating
  size = 'md', // sm, md
  className = ''
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
}
