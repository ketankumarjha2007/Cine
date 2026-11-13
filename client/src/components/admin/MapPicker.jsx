import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';

// Fix leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapPicker({
  latitude = 19.0760, // Default to Mumbai
  longitude = 72.8777,
  onChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = Number(latitude) || 19.0760;
      const initialLng = Number(longitude) || 72.8777;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        if (onChange) {
          onChange(parseFloat(position.lat.toFixed(6)), parseFloat(position.lng.toFixed(6)));
        }
      });

      map.on('click', (event) => {
        const { lat, lng } = event.latlng;
        marker.setLatLng([lat, lng]);
        if (onChange) {
          onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update view if props change externally
      const currentLat = Number(latitude) || 19.0760;
      const currentLng = Number(longitude) || 72.8777;
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      }
      mapInstanceRef.current.setView([currentLat, currentLng], mapInstanceRef.current.getZoom());
    }

    return () => {
      // Keep map reference stable across quick rerenders
    };
  }, [latitude, longitude, onChange]);

  return (
    <div className="map-picker-wrapper">
      <div ref={mapContainerRef} className="map-picker-container" />
      <div className="map-picker-coords-bar">
        <span>Latitude: <strong>{Number(latitude || 0).toFixed(6)}</strong></span>
        <span>Longitude: <strong>{Number(longitude || 0).toFixed(6)}</strong></span>
        <span className="map-picker-hint">Drag pin or click map to reposition</span>
      </div>
    </div>
  );
}
