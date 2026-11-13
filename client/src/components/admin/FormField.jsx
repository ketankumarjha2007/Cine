import React from 'react';
import './FormField.css';

export default function FormField({
  label,
  id,
  error,
  required = false,
  helpText,
  children
}) {
  return (
    <div className={`form-field-root ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="form-field-label">
          {label}
          {required && <span className="field-required-asterisk">*</span>}
        </label>
      )}
      <div className="form-field-control">
        {children}
      </div>
      {helpText && !error && (
        <span className="form-field-help">{helpText}</span>
      )}
      {error && (
        <span className="form-field-error" role="alert">{error}</span>
      )}
    </div>
  );
}
