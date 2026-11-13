import React from 'react';
import { MapPin, Navigation, Building } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import './TheatreCard.css';

export default function TheatreCard({ theatre, distanceKm = null }) {
  if (!theatre) return null;

  return (
    <div className="theatre-card-root">
      <div className="theatre-card-image-box">
        {theatre.image_url ? (
          <img
            src={theatre.image_url}
            alt={theatre.name}
            className="theatre-card-img"
            loading="lazy"
          />
        ) : (
          <div className="theatre-card-placeholder">
            <Building size={32} />
          </div>
        )}
        {distanceKm !== null && (
          <div className="theatre-distance-badge">
            <Navigation size={12} className="nav-arrow" />
            <span>{distanceKm} km away</span>
          </div>
        )}
      </div>

      <div className="theatre-card-body">
        <h3 className="theatre-card-name">{theatre.name}</h3>
        <p className="theatre-card-address">
          <MapPin size={14} className="address-pin-icon" />
          <span>{theatre.address}, {theatre.city}</span>
        </p>

        {theatre.amenities?.length > 0 && (
          <div className="theatre-amenities-row">
            {theatre.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="theatre-amenity-pill">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
