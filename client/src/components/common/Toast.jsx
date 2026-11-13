import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({
  id,
  type = 'info', // success, warning, error, info
  message,
  onClose,
  duration = 4000
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const Icon = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info
  }[type] || Info;

  return (
    <div className={`toast toast-${type}`} role="alert">
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
