import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Monitor, Eye } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import Badge from '../../components/common/Badge.jsx';
import './Screens.css';

export default function AdminScreens() {
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Screen Form
  const [screenName, setScreenName] = useState('Screen 1');
  const [screenType, setScreenType] = useState('2D');
  const [rowsConfig, setRowsConfig] = useState([
    { row: 'A', seats: 10, category: 'VIP' },
    { row: 'B', seats: 12, category: 'Premium' },
    { row: 'C', seats: 12, category: 'Premium' },
    { row: 'D', seats: 14, category: 'Standard' },
    { row: 'E', seats: 14, category: 'Standard' }
  ]);
  const [saving, setSaving] = useState(false);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/theatres');
      const tList = res.data.theatres || [];
      setTheatres(tList);
      if (tList.length > 0 && !selectedTheatreId) {
        setSelectedTheatreId(tList[0].id);
      }
    } catch (err) {
      console.error('[FETCH SCREENS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const activeTheatre = theatres.find((t) => t.id === selectedTheatreId);
  const screens = activeTheatre?.screens || [];

  const handleAddRow = () => {
    const nextCharCode = 65 + rowsConfig.length;
    const nextRowLetter = String.fromCharCode(nextCharCode);
    setRowsConfig([...rowsConfig, { row: nextRowLetter, seats: 12, category: 'Standard' }]);
  };

  const handleRemoveRow = (index) => {
    setRowsConfig(rowsConfig.filter((_, idx) => idx !== index));
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...rowsConfig];
    updated[index][field] = value;
    setRowsConfig(updated);
  };

  const totalSeatsCalculated = rowsConfig.reduce((sum, r) => sum + (parseInt(r.seats, 10) || 0), 0);

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheatreId) {
      alert('Please select a cinema theatre first');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/screens', {
        theatre_id: selectedTheatreId,
        name: screenName,
        screen_type: screenType,
        layout: rowsConfig
      });

      setCreateModalOpen(false);
      fetchTheatres();
    } catch (err) {
      alert(`Failed to create screen: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!confirm('Are you sure you want to delete this screen? All seat mappings will be removed.')) return;
    try {
      await api.delete(`/admin/screens/${screenId}`);
      fetchTheatres();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Screen Name',
      render: (s) => (
        <div className="screen-name-cell">
          <Monitor size={18} className="screen-icon" />
          <span className="screen-name-text">{s.name}</span>
        </div>
      )
    },
    {
      key: 'screen_type',
      header: 'Format',
      render: (s) => <Badge variant="primary">{s.screen_type}</Badge>
    },
    {
      key: 'total_seats',
      header: 'Total Capacity',
      render: (s) => `${s.total_seats} seats`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteScreen(s.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <AdminLayout
      title="Screens & Seat Layouts"
      subtitle="Design auditorium seat maps, row tiers, and capacity configurations"
      actions={
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
          disabled={!selectedTheatreId}
        >
          Add Screen
        </Button>
      }
    >
      {/* Theatre Selector Bar */}
      <div className="theatre-select-card">
        <label htmlFor="theatre-select" className="theatre-select-label">Select Cinema Theatre:</label>
        <select
          id="theatre-select"
          value={selectedTheatreId}
          onChange={(e) => setSelectedTheatreId(e.target.value)}
          className="theatre-dropdown-select"
        >
          {theatres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.city})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={screens}
        loading={loading}
        total={screens.length}
      />

      {/* Screen Creator Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Screen & Generate Layout"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateScreen} className="screen-form-dialog">
          <div className="form-row-grid">
            <FormField label="Screen Name" required>
              <input
                type="text"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                placeholder="e.g. Audi 1 - Dolby Cinema"
                required
              />
            </FormField>

            <FormField label="Format" required>
              <select value={screenType} onChange={(e) => setScreenType(e.target.value)}>
                <option value="2D">2D Digital</option>
                <option value="3D">3D Digital</option>
                <option value="IMAX">IMAX 3D</option>
                <option value="4DX">4DX Atmos</option>
                <option value="ICE">ICE Theatres</option>
              </select>
            </FormField>
          </div>

          <div className="seat-layout-builder-section">
            <div className="builder-header">
              <div>
                <h4 className="builder-title">Auditorium Row Configuration</h4>
                <p className="builder-subtitle">Define rows, seat counts, and seating categories</p>
              </div>
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddRow}>
                Add Row
              </Button>
            </div>

            <div className="rows-config-table">
              {rowsConfig.map((row, idx) => (
                <div key={idx} className="row-config-item">
                  <div className="row-letter-badge">{row.row}</div>
                  <div className="row-seats-input-box">
                    <label className="config-sublabel">Seats in Row</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={row.seats}
                      onChange={(e) => handleUpdateRow(idx, 'seats', e.target.value)}
                      className="seat-count-input"
                    />
                  </div>
                  <div className="row-cat-select-box">
                    <label className="config-sublabel">Tier Category</label>
                    <select
                      value={row.category}
                      onChange={(e) => handleUpdateRow(idx, 'category', e.target.value)}
                      className="seat-cat-select"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="VIP">VIP / Recliner</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="row-remove-btn"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={rowsConfig.length <= 1}
                    aria-label="Remove row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Live Visual Seat Map Preview */}
            <div className="live-seat-preview">
              <div className="preview-screen-bar">SCREEN THIS WAY</div>
              <div className="preview-grid">
                {rowsConfig.map((row, rIdx) => (
                  <div key={rIdx} className="preview-row">
                    <span className="preview-row-label">{row.row}</span>
                    <div className="preview-seats-row">
                      {Array.from({ length: Math.min(parseInt(row.seats, 10) || 0, 30) }).map((_, sIdx) => (
                        <div
                          key={sIdx}
                          className={`preview-seat-dot cat-${row.category?.toLowerCase()}`}
                          title={`Row ${row.row} Seat ${sIdx + 1} (${row.category})`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="preview-footer-info">
                <span>Total Calculated Seats: <strong>{totalSeatsCalculated}</strong></span>
              </div>
            </div>
          </div>

          <div className="modal-actions-footer">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Generate Screen & Seats
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
