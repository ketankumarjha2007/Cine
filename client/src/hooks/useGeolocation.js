import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cineticket_user_location';

export function useGeolocation() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestCoordinates = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        setLocation(coords);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch (e) {
          console.warn('[STORAGE WARN]', e);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Location permission denied');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes cache
      }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[STORAGE WARN]', e);
    }
  };

  return {
    location,
    loading,
    error,
    requestCoordinates,
    clearLocation
  };
}
