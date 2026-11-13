import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useLocationContext } from '../context/LocationContext.jsx';
import { calculateDistanceKm } from '../utils/distance.js';
import PageShell from '../components/layout/PageShell.jsx';
import HeroCarousel from '../components/movies/HeroCarousel.jsx';
import MovieRow from '../components/movies/MovieRow.jsx';
import FilterBar from '../components/movies/FilterBar.jsx';
import TheatreCard from '../components/theatres/TheatreCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './Home.css';

export default function Home() {
  const { selectedCity, coordinates } = useLocationContext();

  const [banners, setBanners] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        // Fetch active banners
        const { data: bannerData } = await supabase
          .from('banners')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });

        // Fetch now showing and upcoming movies
        const { data: movieData } = await supabase
          .from('movies')
          .select('*')
          .in('status', ['now_showing', 'upcoming'])
          .order('release_date', { ascending: false });

        // Fetch theatres in selected city or nearby
        const { data: theatreData } = await supabase
          .from('theatres')
          .select('*')
          .eq('city', selectedCity);

        setBanners(bannerData || []);
        setMovies(movieData || []);
        setTheatres(theatreData || []);
      } catch (err) {
        console.error('[HOME FETCH ERROR]', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [selectedCity]);

  // Distinct languages and genres for filter bar
  const availableLanguages = [...new Set(movies.map((m) => m.language).filter(Boolean))];
  const allGenres = movies.flatMap((m) => m.genres || []);
  const availableGenres = [...new Set(allGenres.filter(Boolean))];

  // Filtered movies
  const filteredMovies = movies.filter((m) => {
    if (selectedLanguage && m.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
      return false;
    }
    if (selectedGenre && (!m.genres || !m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const nowShowingMovies = filteredMovies.filter((m) => m.status === 'now_showing');
  const upcomingMovies = filteredMovies.filter((m) => m.status === 'upcoming');

  // Calculate distances for theatres if coordinates present
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
      {/* Hero Carousel */}
      <HeroCarousel banners={banners} fallbackMovies={nowShowingMovies} />

      <div className="container home-content-container">
        {/* Filter Bar */}
        <FilterBar
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          availableLanguages={availableLanguages}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          availableGenres={availableGenres}
          onReset={() => {
            setSelectedLanguage('');
            setSelectedGenre('');
          }}
        />

        {/* Now Showing Section */}
        <MovieRow
          title="Now Showing"
          subtitle={`Latest theatrical releases playing in ${selectedCity}`}
          movies={nowShowingMovies}
          loading={loading}
          emptyMessage={`No movies currently showing in ${selectedCity} matching your filters.`}
        />

        {/* Coming Soon Section */}
        <MovieRow
          title="Coming Soon"
          subtitle="Anticipated upcoming blockbusters arriving soon in cinemas"
          movies={upcomingMovies}
          loading={loading}
          emptyMessage="No upcoming titles scheduled at this moment."
        />

        {/* Theatres Near You Section */}
        <section className="home-theatres-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Cinemas & Theatres in {selectedCity}</h2>
              <p className="section-subtitle">Premium multiplexes and single screens near you</p>
            </div>
          </div>

          {theatresWithDistance.length === 0 ? (
            <EmptyState
              title="No Theatres Listed"
              description={`There are currently no cinema theatres listed in ${selectedCity}. Try selecting a different city from the top bar.`}
            />
          ) : (
            <div className="theatres-grid">
              {theatresWithDistance.map((theatre) => (
                <TheatreCard
                  key={theatre.id}
                  theatre={theatre}
                  distanceKm={theatre.distanceKm}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
