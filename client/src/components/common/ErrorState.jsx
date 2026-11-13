import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';
import './ErrorState.css';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while fetching information.',
  onRetry = null
}) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon-wrapper">
        <AlertCircle size={36} className="error-state-icon" />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
