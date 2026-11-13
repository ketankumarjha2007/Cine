import { useState, useEffect } from 'react';

export function useCountdown(targetDate, onExpire) {
  const calculateRemainingSeconds = () => {
    if (!targetDate) return 0;
    const targetMs = new Date(targetDate).getTime();
    const diff = Math.floor((targetMs - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemainingSeconds);

  useEffect(() => {
    setSecondsLeft(calculateRemainingSeconds());

    if (!targetDate) return;

    const intervalId = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        if (typeof onExpire === 'function') {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsLeft,
    formatted,
    isExpired: secondsLeft <= 0
  };
}
