import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';

const LocationContext = createContext(null);

const STORAGE_CITY_KEY = 'cineticket_selected_city';
const STORAGE_COORDS_KEY = 'cineticket_user_coords';

export function LocationProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem(STORAGE_CITY_KEY) || 'Mumbai';
  });

  const [coordinates, setCoordinates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COORDS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [availableCities, setAvailableCities] = useState([]);
  const [geoPromptOpen, setGeoPromptOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Fetch distinct cities from database
  useEffect(() => {
    async function loadCities() {
      try {
        const { data, error } = await supabase
          .from('theatres')
          .select('city')
          .order('city', { ascending: true });

        if (!error && data) {
          const uniqueCities = [...new Set(data.map((t) => t.city).filter(Boolean))];
          if (uniqueCities.length > 0) {
            setAvailableCities(uniqueCities);
            if (!localStorage.getItem(STORAGE_CITY_KEY) && !selectedCity) {
              setSelectedCity(uniqueCities[0]);
            }
          }
        }
      } catch (err) {
        console.warn('[LOCATION] Failed to fetch distinct cities:', err);
      }
    }
    loadCities();
  }, []);

  const changeCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem(STORAGE_CITY_KEY, city);
  };

  const setCoords = (coords) => {
    setCoordinates(coords);
    if (coords) {
      localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(coords));
    } else {
      localStorage.removeItem(STORAGE_COORDS_KEY);
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = { latitude: lat, longitude: lng };
        setCoords(coords);

        // Reverse geocode with OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'User-Agent': 'CineTicket-App/1.0' } }
          );
          if (res.ok) {
            const geocodeData = await res.json();
            const city =
              geocodeData.address?.city ||
              geocodeData.address?.town ||
              geocodeData.address?.state_district ||
              geocodeData.address?.state;

            if (city) {
              changeCity(city);
            }
          }
        } catch (e) {
          console.warn('[LOCATION REVERSE GEOCODE FAIL]', e);
        }

        setGeoLoading(false);
        setGeoPromptOpen(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoPromptOpen(false);
        console.warn('[GEOLOCATION PERMISSION DENIED/ERROR]', err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const value = {
    selectedCity,
    changeCity,
    coordinates,
    availableCities,
    geoPromptOpen,
    setGeoPromptOpen,
    geoLoading,
    requestBrowserLocation
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
}
