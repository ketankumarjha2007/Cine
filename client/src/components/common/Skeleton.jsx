import React from 'react';
import './Skeleton.css';

export default function Skeleton({
  variant = 'text', // text, rect, circle, card
  width,
  height,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined,
        ...style
      }}
      aria-hidden="true"
    />
  );
}
