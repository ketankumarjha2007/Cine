import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const [imageError, setImageError] = useState(false);

  if (!movie) return null;

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-root">
      <div className="movie-card-poster-wrapper">
        {movie.poster_url && !imageError ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="movie-card-poster"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="movie-card-placeholder">
            <Film size={36} className="placeholder-film-icon" />
            <span style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0 8px', marginTop: '4px', opacity: 0.8 }}>
              {movie.title}
            </span>
          </div>
        )}

        {/* Rating Overlay */}
        {movie.rating && (
          <div className="movie-card-rating">
            <Star size={12} className="rating-star-icon" fill="currentColor" />
            <span>{Number(movie.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Certificate Pill */}
        {movie.certificate && (
          <div className="movie-card-certificate">
            {movie.certificate}
          </div>
        )}
      </div>

      <div className="movie-card-meta">
        <h3 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h3>
        <p className="movie-card-info">
          {movie.language} • {movie.genres?.slice(0, 2).join(', ') || 'Feature'}
        </p>
      </div>
    </Link>
  );
}
