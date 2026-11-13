import React from 'react';
import { Film } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no records matching your criteria right now.',
  icon: Icon = Film,
  action = null
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">
        <Icon size={36} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
