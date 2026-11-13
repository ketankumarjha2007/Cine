import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Play, Clock, Calendar, Globe, Building, Film, Navigation } from 'lucide-react';
import { supabase } from '../services/supabase.js';
import api from '../services/api.js';
import { useLocationContext } from '../context/LocationContext.jsx';
import { useBooking } from '../context/BookingContext.jsx';
import { calculateDistanceKm } from '../utils/distance.js';
import { formatDuration, formatDateIST } from '../utils/format.js';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import DateStrip from '../components/theatres/DateStrip.jsx';
import ShowTimeChip from '../components/theatres/ShowTimeChip.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './MovieDetails.css';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCity, coordinates } = useLocationContext();
  const { setSelectedShow } = useBooking();

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Showtimes state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(true);

  // Fetch Movie Info and Server TMDB credits
  useEffect(() => {
    async function loadMovie() {
      try {
        setLoading(true);
        const { data: movieData, error } = await supabase
          .from('movies')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !movieData) {
          throw new Error('Movie not found');
        }

        setMovie(movieData);

        // Fetch cast credits from server via TMDB endpoint if tmdb_id exists
        if (movieData.tmdb_id) {
          try {
            const tmdbRes = await api.get(`/tmdb/movie/${movieData.tmdb_id}`);
            if (tmdbRes.data?.cast) {
              setCast(tmdbRes.data.cast);
            }
          } catch (castErr) {
            console.warn('[TMDB CAST FETCH WARN]', castErr);
          }
        }
      } catch (err) {
        console.error('[LOAD MOVIE ERROR]', err);
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  // Fetch Shows for this Movie, Date, and City
  useEffect(() => {
    async function loadShows() {
      if (!id) return;
      try {
        setShowsLoading(true);
        const startOfDay = `${selectedDate}T00:00:00.000Z`;
        const endOfDay = `${selectedDate}T23:59:59.999Z`;

        const { data, error } = await supabase
          .from('shows')
          .select(`
            id,
            starts_at,
            ends_at,
            language,
            format,
            price_by_category,
            status,
            screen:screen_id (
              id,
              name,
              theatre:theatre_id (
                id,
                name,
                address,
                city,
                location
              )
            )
          `)
          .eq('movie_id', id)
          .eq('status', 'scheduled')
          .gte('starts_at', startOfDay)
          .lte('starts_at', endOfDay)
          .order('starts_at', { ascending: true });

        if (error) throw error;

        // Filter shows by active city
        const cityShows = (data || []).filter(
          (s) => s.screen?.theatre?.city?.toLowerCase() === selectedCity?.toLowerCase()
        );

        setShows(cityShows);
      } catch (err) {
        console.error('[LOAD SHOWS ERROR]', err);
      } finally {
        setShowsLoading(false);
      }
    }

    loadShows();
  }, [id, selectedDate, selectedCity]);

  if (loading) {
    return (
      <PageShell>
        <div className="movie-details-loader">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  if (!movie) {
    return (
      <PageShell>
        <div className="container">
          <EmptyState
            title="Movie not found"
            description="The requested film could not be located in our catalog."
          />
        </div>
      </PageShell>
    );
  }

  // Group shows by Theatre
  const theatreGroupMap = new Map();
  shows.forEach((show) => {
    const theatre = show.screen?.theatre;
    if (!theatre) return;

    if (!theatreGroupMap.has(theatre.id)) {
      let lat = null;
      let lng = null;
      if (theatre.location && typeof theatre.location === 'string') {
        const match = theatre.location.match(/POINT\(([^ ]+) ([^ ]+)\)/i);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }

      let dist = null;
      if (coordinates && lat && lng) {
        dist = calculateDistanceKm(coordinates.latitude, coordinates.longitude, lat, lng);
      }

      theatreGroupMap.set(theatre.id, {
        theatre,
        distanceKm: dist,
        shows: []
      });
    }

    theatreGroupMap.get(theatre.id).shows.push(show);
  });

  const theatreGroups = Array.from(theatreGroupMap.values()).sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return a.theatre.name.localeCompare(b.theatre.name);
  });

  const handleSelectShow = (show) => {
    setSelectedShow({
      ...show,
      movie
    });
    navigate(`/seats/${show.id}`);
  };

  return (
    <PageShell>
      {/* Backdrop Header Banner */}
      <div className="movie-header-backdrop-wrap">
        {movie.backdrop_url && (
          <img
            src={movie.backdrop_url}
            alt=""
            className="movie-backdrop-img"
            loading="eager"
          />
        )}
        <div className="backdrop-gradient-overlay" />

        <div className="container movie-header-content">
          <div className="movie-header-grid">
            {/* Poster */}
            <div className="movie-poster-box">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} className="movie-poster-img" />
              ) : (
                <div className="poster-empty-box"><Film size={48} /></div>
              )}
            </div>

            {/* Info */}
            <div className="movie-info-box">
              <h1 className="movie-title-heading">{movie.title}</h1>

              <div className="movie-tags-row">
                {movie.certificate && <span className="meta-badge">{movie.certificate}</span>}
                <span className="meta-item"><Globe size={14} /> {movie.language}</span>
                <span className="meta-item"><Clock size={14} /> {formatDuration(movie.duration_minutes)}</span>
                {movie.release_date && (
                  <span className="meta-item"><Calendar size={14} /> {formatDateIST(movie.release_date)}</span>
                )}
                {movie.rating && (
                  <div className="meta-rating-pill">
                    <Star size={14} className="star-icon" fill="currentColor" />
                    <span>{Number(movie.rating).toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              {movie.genres?.length > 0 && (
                <div className="movie-genres-list">
                  {movie.genres.map((g) => (
                    <span key={g} className="genre-pill">{g}</span>
                  ))}
                </div>
              )}

              {movie.overview && (
                <p className="movie-synopsis-text">{movie.overview}</p>
              )}

              {movie.trailer_key && (
                <div className="movie-trailer-cta">
                  <Button
                    variant="outline"
                    icon={Play}
                    onClick={() => setTrailerOpen(true)}
                  >
                    Watch Official Trailer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Credits Section */}
      {cast.length > 0 && (
        <div className="container movie-cast-container">
          <h2 className="section-title">Top Cast</h2>
          <div className="cast-scroll-row">
            {cast.map((actor, idx) => (
              <div key={idx} className="cast-member-card">
                <div className="cast-avatar-box">
                  {actor.profile_url ? (
                    <img src={actor.profile_url} alt={actor.name} className="cast-avatar-img" loading="lazy" />
                  ) : (
                    <div className="cast-avatar-empty">{actor.name.charAt(0)}</div>
                  )}
                </div>
                <span className="cast-name">{actor.name}</span>
                <span className="cast-char">{actor.character}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Showtimes & Theatre Selection */}
      <div className="container movie-shows-container">
        <h2 className="section-title">Screenings in {selectedCity}</h2>

        {/* 7-day date strip */}
        <DateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {showsLoading ? (
          <div className="shows-loading-box">
            <Spinner size="md" />
          </div>
        ) : theatreGroups.length === 0 ? (
          <EmptyState
            title="No Shows Scheduled"
            description={`There are no screenings scheduled for ${movie.title} in ${selectedCity} on ${formatDateIST(selectedDate)}. Try selecting another date.`}
          />
        ) : (
          <div className="theatres-shows-list">
            {theatreGroups.map(({ theatre, distanceKm, shows: theatreShows }) => (
              <div key={theatre.id} className="theatre-showtimes-card">
                <div className="theatre-card-head">
                  <div className="theatre-name-block">
                    <h3 className="theatre-head-title">{theatre.name}</h3>
                    <p className="theatre-head-address">{theatre.address}</p>
                  </div>
                  {distanceKm !== null && (
                    <span className="theatre-dist-badge">
                      <Navigation size={12} />
                      {distanceKm} km
                    </span>
                  )}
                </div>

                <div className="theatre-chips-grid">
                  {theatreShows.map((show) => (
                    <ShowTimeChip
                      key={show.id}
                      show={show}
                      onSelect={handleSelectShow}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {movie.trailer_key && (
        <Modal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          title={`${movie.title} - Official Trailer`}
          maxWidth="760px"
        >
          <div className="trailer-video-responsive">
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
              title="Official YouTube Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
