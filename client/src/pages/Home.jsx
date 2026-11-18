import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useLocationContext } from '../context/LocationContext.jsx';
import { calculateDistanceKm } from '../utils/distance.js';
import PageShell from '../components/layout/PageShell.jsx';
import HeroCarousel from '../components/movies/HeroCarousel.jsx';
import MovieRow from '../components/movies/MovieRow.jsx';
import SearchBar from '../components/movies/SearchBar.jsx';
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  // Track which movie IDs have future shows in the selected city
  const [cityMovieIds, setCityMovieIds] = useState(null); // null = loading

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        setCityMovieIds(null);

        const nowIso = new Date().toISOString();

        // Fetch active banners, all movies, and theatres in parallel
        const [bannerRes, movieRes, theatreRes] = await Promise.all([
          supabase
            .from('banners')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('movies')
            .select('*')
            .in('status', ['now_showing', 'upcoming'])
            .order('release_date', { ascending: false }),
          supabase
            .from('theatres')
            .select('*')
            .eq('city', selectedCity),
        ]);

        const theatreList = theatreRes.data || [];
        setBanners(bannerRes.data || []);
        setMovies(movieRes.data || []);
        setTheatres(theatreList);

        // ── City-aware filtering for now_showing ─────────────────────────────
        // Get all future scheduled shows in this city via theatre->screen->show join
        const theatreIds = theatreList.map((t) => t.id);

        if (theatreIds.length > 0) {
          // Get screens for these theatres
          const { data: screenData } = await supabase
            .from('screens')
            .select('id')
            .in('theatre_id', theatreIds);

          const screenIds = (screenData || []).map((sc) => sc.id);

          if (screenIds.length > 0) {
            const { data: showData } = await supabase
              .from('shows')
              .select('movie_id')
              .in('screen_id', screenIds)
              .eq('status', 'scheduled')
              .gt('starts_at', nowIso)
              .limit(5000);

            const ids = new Set((showData || []).map((s) => s.movie_id));
            setCityMovieIds(ids);
          } else {
            setCityMovieIds(new Set());
          }
        } else {
          setCityMovieIds(new Set());
        }
      } catch (err) {
        console.error('[HOME FETCH ERROR]', err);
        setCityMovieIds(new Set());
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchGenre = m.genres?.some((g) => g.toLowerCase().includes(q));
      const matchLang = m.language?.toLowerCase().includes(q);
      if (!matchTitle && !matchGenre && !matchLang) {
        return false;
      }
    }
    if (selectedLanguage && m.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
      return false;
    }
    if (selectedGenre && (!m.genres || !m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // now_showing: only include movies that have a future scheduled show in the selected city
  const nowShowingMovies = filteredMovies.filter(
    (m) => m.status === 'now_showing' && (cityMovieIds === null || cityMovieIds.has(m.id))
  );
  // upcoming: show all upcoming regardless of scheduling (they may not be scheduled yet)
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

      {/* Bhojpuri Slogan Banner */}
      <div className="slogan-banner">
        <div className="slogan-inner">
          <span className="slogan-deco slogan-deco-left">&#9654;</span>
          <p className="slogan-text">
            <span className="slogan-line1">फिल्म देखे के बा?</span>
            <span className="slogan-line2">टिकट <strong>CineTicket</strong> से कटावे के बा!</span>
          </p>
          <span className="slogan-deco slogan-deco-right">&#9664;</span>
        </div>
      </div>

      <div className="container home-content-container">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search movies by title, genre, or language..."
        />

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
            setSearchQuery('');
          }}
        />

        {/* Now Showing Section */}
        <MovieRow
          title="Now Showing"
          subtitle={`Latest theatrical releases playing in ${selectedCity}`}
          movies={nowShowingMovies}
          loading={loading}
          emptyMessage={
            searchQuery
              ? `No now-showing movies in ${selectedCity} matching "${searchQuery}".`
              : `No movies currently showing in ${selectedCity} matching your filters.`
          }
        />

        {/* Coming Soon Section */}
        <MovieRow
          title="Coming Soon"
          subtitle="Anticipated upcoming blockbusters arriving soon in cinemas"
          movies={upcomingMovies}
          loading={loading}
          emptyMessage={
            searchQuery
              ? `No upcoming movies matching "${searchQuery}".`
              : "No upcoming titles scheduled at this moment."
          }
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
