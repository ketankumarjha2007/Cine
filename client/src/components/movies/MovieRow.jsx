import React from 'react';
import MovieCard from './MovieCard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import Skeleton from '../common/Skeleton.jsx';
import './MovieRow.css';

export default function MovieRow({
  title,
  subtitle,
  movies = [],
  loading = false,
  emptyMessage = 'No movies scheduled in this category.'
}) {
  return (
    <section className="movie-row-section">
      <div className="movie-row-header">
        <div>
          <h2 className="movie-row-title">{title}</h2>
          {subtitle && <p className="movie-row-subtitle">{subtitle}</p>}
        </div>
      </div>

      {loading ? (
        <div className="movie-cards-grid">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="skeleton-movie-card">
              <Skeleton variant="card" />
              <Skeleton variant="text" width="80%" style={{ marginTop: '8px' }} />
              <Skeleton variant="text" width="50%" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <EmptyState
          title="No Movies Available"
          description={emptyMessage}
        />
      ) : (
        <div className="movie-cards-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
}
