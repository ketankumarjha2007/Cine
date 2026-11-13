import React, { useState } from 'react';
import { MapPin, Navigation, Building, ExternalLink, Sparkles } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import './TheatreCard.css';

export default function TheatreCard({ theatre, distanceKm = null }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!theatre) return null;

  const handleOpenMaps = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${theatre.name}, ${theatre.address}, ${theatre.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div 
        className="theatre-card-root" 
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setModalOpen(true);
          }
        }}
        aria-label={`View details for ${theatre.name}`}
      >
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

          <div className="theatre-card-overlay-badge">
            <span>View Location</span>
          </div>

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
              {theatre.amenities.length > 3 && (
                <span className="theatre-amenity-pill more">
                  +{theatre.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theatre Details & Location Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={theatre.name}
        size="md"
      >
        <div className="theatre-modal-content">
          {theatre.image_url && (
            <div className="theatre-modal-image-wrapper">
              <img
                src={theatre.image_url}
                alt={theatre.name}
                className="theatre-modal-image"
              />
            </div>
          )}

          <div className="theatre-modal-info-block">
            <div className="theatre-modal-location-header">
              <MapPin size={18} className="theatre-modal-pin" />
              <div>
                <h4 className="theatre-modal-full-address">{theatre.address}</h4>
                <p className="theatre-modal-city-state">
                  {theatre.city}, {theatre.state} - {theatre.pincode}
                </p>
              </div>
            </div>

            {distanceKm !== null && (
              <div className="theatre-modal-distance">
                <Navigation size={14} />
                <span>Approximately {distanceKm} km from your current location</span>
              </div>
            )}

            {theatre.amenities?.length > 0 && (
              <div className="theatre-modal-amenities-section">
                <div className="theatre-modal-section-title">
                  <Sparkles size={14} />
                  <span>Cinema Experience & Amenities</span>
                </div>
                <div className="theatre-modal-amenities-grid">
                  {theatre.amenities.map((amenity, idx) => (
                    <div key={idx} className="theatre-modal-amenity-card">
                      <span className="amenity-dot"></span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="theatre-modal-actions">
              <Button
                variant="primary"
                fullWidth
                icon={ExternalLink}
                onClick={handleOpenMaps}
              >
                Open in Google Maps / Get Directions
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
