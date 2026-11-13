import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search movies by title, genre, or language...',
  onClear
}) {
  return (
    <div className="search-bar-root">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search movies"
        />
        {value && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClear}
            aria-label="Clear search query"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
