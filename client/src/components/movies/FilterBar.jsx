import React from 'react';
import { Filter, X } from 'lucide-react';
import './FilterBar.css';

export default function FilterBar({
  selectedLanguage,
  onLanguageChange,
  availableLanguages = [],
  selectedGenre,
  onGenreChange,
  availableGenres = [],
  onReset
}) {
  const hasActiveFilters = Boolean(selectedLanguage || selectedGenre);

  return (
    <div className="filter-bar-root">
      <div className="filter-bar-header">
        <div className="filter-title-box">
          <Filter size={16} className="filter-header-icon" />
          <span className="filter-title-text">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-clear-btn"
            onClick={onReset}
          >
            <X size={14} />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      <div className="filter-controls-row">
        {/* Languages */}
        <div className="filter-group">
          <span className="filter-group-label">Language:</span>
          <div className="filter-chips-list">
            <button
              type="button"
              className={`filter-chip ${!selectedLanguage ? 'active' : ''}`}
              onClick={() => onLanguageChange('')}
            >
              All
            </button>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`filter-chip ${selectedLanguage === lang ? 'active' : ''}`}
                onClick={() => onLanguageChange(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="filter-group">
          <span className="filter-group-label">Genre:</span>
          <div className="filter-chips-list">
            <button
              type="button"
              className={`filter-chip ${!selectedGenre ? 'active' : ''}`}
              onClick={() => onGenreChange('')}
            >
              All
            </button>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`filter-chip ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => onGenreChange(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
