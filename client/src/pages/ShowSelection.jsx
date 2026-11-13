import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useLocationContext } from '../context/LocationContext.jsx';
import { calculateDistanceKm } from '../utils/distance.js';
import PageShell from '../components/layout/PageShell.jsx';
import TheatreCard from '../components/theatres/TheatreCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import './ShowSelection.css';

export default function ShowSelection() {
  const { selectedCity, coordinates } = useLocationContext();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheatres() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('theatres')
          .select(`
            *,
            screens (id, name, screen_type, total_seats)
          `)
          .eq('city', selectedCity);

        if (error) throw error;
        setTheatres(data || []);
      } catch (err) {
        console.error('[LOAD THEATRES ERROR]', err);
      } finally {
        setLoading(false);
      }
    }

    loadTheatres();
  }, [selectedCity]);

  const theatresWithDistance = theatres.map((t) => {
    let lat = null;
    let lng = null;
    if (t.location && typeof t.location === 'string') {
      const match = t.location.match(/POINT\(([^ ]+) ([^ ]+)\)/i);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    }

    let dist = null;
    if (coordinates && lat && lng) {
      dist = calculateDistanceKm(coordinates.latitude, coordinates.longitude, lat, lng);
    }
    return { ...t, distanceKm: dist };
  }).sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return 0;
  });

  return (
    <PageShell>
      <div className="container show-selection-page">
        <div className="theatres-page-header">
          <h1 className="theatres-page-title">Cinema Theatres in {selectedCity}</h1>
          <p className="theatres-page-subtitle">
            Find certified multiplexes with Dolby Atmos, IMAX, and 4K Laser projection near you
          </p>
        </div>

        {loading ? (
          <div className="theatres-page-loader">
            <Spinner size="lg" />
          </div>
        ) : theatresWithDistance.length === 0 ? (
          <EmptyState
            title="No Theatres Found"
            description={`There are currently no theatres available in ${selectedCity}. Please select another city from the top bar.`}
          />
        ) : (
          <div className="theatres-page-grid">
            {theatresWithDistance.map((theatre) => (
              <TheatreCard
                key={theatre.id}
                theatre={theatre}
                distanceKm={theatre.distanceKm}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
