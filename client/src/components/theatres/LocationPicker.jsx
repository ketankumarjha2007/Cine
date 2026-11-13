import React, { useState } from 'react';
import { MapPin, Navigation, Check } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext.jsx';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import './LocationPicker.css';

export default function LocationPicker({ isOpen, onClose }) {
  const {
    selectedCity,
    changeCity,
    availableCities,
    requestBrowserLocation,
    geoLoading
  } = useLocationContext();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = (availableCities.length > 0 ? availableCities : ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']).filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (city) => {
    changeCity(city);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Your City">
      <div className="location-picker-modal">
        <div className="location-detect-row">
          <Button
            variant="outline"
            fullWidth
            icon={Navigation}
            loading={geoLoading}
            onClick={requestBrowserLocation}
          >
            Detect My Current Location
          </Button>
        </div>

        <div className="location-search-box">
          <input
            type="text"
            placeholder="Search for your city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="location-search-input"
            autoFocus
          />
        </div>

        <div className="location-cities-grid">
          {filteredCities.map((city) => {
            const isSelected = city.toLowerCase() === selectedCity.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                className={`city-pill ${isSelected ? 'city-pill-active' : ''}`}
                onClick={() => handleSelect(city)}
              >
                <span>{city}</span>
                {isSelected && <Check size={14} className="city-pill-check" />}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
