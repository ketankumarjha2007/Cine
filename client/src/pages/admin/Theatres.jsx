import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import MapPicker from '../../components/admin/MapPicker.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import './Theatres.css';

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentThread, setCurrentTheatre] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [imageUrl, setImageUrl] = useState('');
  const [amenitiesStr, setAmenitiesStr] = useState('4K Laser, Dolby Atmos, Recliner Seats');
  const [saving, setSaving] = useState(false);

  // Geocoding helper
  const [geocodeQuery, setGeocodeQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/theatres', { params: { search } });
      setTheatres(res.data.theatres || []);
    } catch (err) {
      console.error('[FETCH THEATRES ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [search]);

  const handleOpenEdit = (t = null) => {
    setCurrentTheatre(t);
    if (t) {
      setName(t.name || '');
      setAddress(t.address || '');
      setCity(t.city || '');
      setState(t.state || '');
      setPincode(t.pincode || '');
      setLatitude(t.latitude || 19.0760);
      setLongitude(t.longitude || 72.8777);
      setImageUrl(t.image_url || '');
      setAmenitiesStr(Array.isArray(t.amenities) ? t.amenities.join(', ') : '');
    } else {
      setName('');
      setAddress('');
      setCity('Mumbai');
      setState('Maharashtra');
      setPincode('400001');
      setLatitude(19.0760);
      setLongitude(72.8777);
      setImageUrl('');
      setAmenitiesStr('4K Laser, Dolby Atmos, Recliner Seats');
    }
    setGeocodeQuery('');
    setEditModalOpen(true);
  };

  const handleGeocodeSearch = async () => {
    if (!geocodeQuery) return;
    try {
      setGeocoding(true);
      const res = await api.get('/admin/theatres/geocode', { params: { q: geocodeQuery } });
      const results = res.data.results || [];
      if (results.length > 0) {
        const top = results[0];
        setLatitude(parseFloat(top.lat));
        setLongitude(parseFloat(top.lon));
      } else {
        alert('No location found for query');
      }
    } catch (err) {
      alert(`Geocode failed: ${err.message}`);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amenities = amenitiesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name,
        address,
        city,
        state,
        pincode,
        latitude: Number(latitude),
        longitude: Number(longitude),
        image_url: imageUrl || null,
        amenities
      };

      if (currentThread) {
        await api.put(`/admin/theatres/${currentThread.id}`, payload);
      } else {
        await api.post('/admin/theatres', payload);
      }

      setEditModalOpen(false);
      fetchTheatres();
    } catch (err) {
      alert(`Failed to save theatre: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete theatre "${t.name}"? This will delete all its screens and seat configurations.`)) return;
    try {
      await api.delete(`/admin/theatres/${t.id}`);
      fetchTheatres();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Theatre & Location',
      render: (t) => (
        <div>
          <div className="theatre-name-row">{t.name}</div>
          <div className="theatre-sub-row">{t.address}, {t.city} ({t.pincode})</div>
        </div>
      )
    },
    {
      key: 'screens',
      header: 'Screens',
      render: (t) => t.screens?.length || 0
    },
    {
      key: 'coords',
      header: 'Coordinates',
      render: (t) => (
        <span className="coords-text">
          {Number(t.latitude || 0).toFixed(4)}, {Number(t.longitude || 0).toFixed(4)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="table-actions-cell">
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleOpenEdit(t)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(t)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Theatres Management"
      subtitle="Configure physical cinema locations, geospatial coordinates, and amenities"
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => handleOpenEdit(null)}>
          Add Theatre
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={theatres}
        loading={loading}
        total={theatres.length}
        searchPlaceholder="Search theatres by name..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Edit / Create Theatre Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={currentThread ? 'Edit Theatre' : 'Add New Cinema Theatre'}
        maxWidth="680px"
      >
        <form onSubmit={handleSaveTheatre} className="theatre-form-dialog">
          <FormField label="Theatre Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CineTicket IMAX & Multiplex"
              required
            />
          </FormField>

          <FormField label="Street Address" required>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Phoenix Palladium, Senapati Bapat Marg"
              required
            />
          </FormField>

          <div className="form-row-grid-3">
            <FormField label="City" required>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </FormField>

            <FormField label="State" required>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </FormField>

            <FormField label="PIN Code" required>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Amenities (comma-separated)">
            <input
              type="text"
              value={amenitiesStr}
              onChange={(e) => setAmenitiesStr(e.target.value)}
              placeholder="Dolby Atmos, 4K Laser, Wheelchair Accessible"
            />
          </FormField>

          <FormField label="Theatre Banner / Photo">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder="theatres"
              label="Upload Cinema Photo"
            />
          </FormField>

          {/* Map Location Picker */}
          <div className="theatre-map-section">
            <label className="form-field-label">Geographic Location (Map Picker)</label>
            <div className="geocode-helper-row">
              <input
                type="text"
                placeholder="Search location in India (e.g. Bandra West, Mumbai)..."
                value={geocodeQuery}
                onChange={(e) => setGeocodeQuery(e.target.value)}
                className="geocode-search-input"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Search}
                onClick={handleGeocodeSearch}
                loading={geocoding}
              >
                Find Coordinates
              </Button>
            </div>

            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>

          <div className="modal-actions-footer">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save Theatre
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
