/**
 * Currency formatter for Indian Rupee
 */
export function formatCurrency(amount, useSymbol = true) {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return useSymbol ? `₹${formatted}` : `INR ${formatted}`;
}

/**
 * Format timestamp in IST (Asia/Kolkata)
 */
export function formatDateIST(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
}

/**
 * Format time in IST (e.g. 07:30 PM)
 */
export function formatTimeIST(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format duration minutes into hours and minutes (e.g. 2h 15m)
 */
export function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}
