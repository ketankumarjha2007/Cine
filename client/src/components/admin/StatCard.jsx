import React from 'react';
import './StatCard.css';

export default function StatCard({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = 'default'
}) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-content">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
        {subvalue && <span className="stat-card-subvalue">{subvalue}</span>}
      </div>
      {Icon && (
        <div className="stat-card-icon-box">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
