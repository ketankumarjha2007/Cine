import React, { useState, useEffect } from 'react';
import { Plus, Edit2, AlertCircle } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDateIST, formatTimeIST, formatCurrency } from '../../utils/format.js';
import './Shows.css';

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [language, setLanguage] = useState('Hindi');
  const [format, setFormat] = useState('2D');
  const [standardPrice, setStandardPrice] = useState(250);
  const [premiumPrice, setPremiumPrice] = useState(350);
  const [vipPrice, setVipPrice] = useState(500);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/admin/shows'),
        api.get('/admin/movies', { params: { limit: 100 } }),
        api.get('/admin/theatres')
      ]);

      setShows(showsRes.data.shows || []);
      const mList = moviesRes.data.movies || [];
      const tList = theatresRes.data.theatres || [];
      setMovies(mList);
      setTheatres(tList);

      if (mList.length > 0 && !selectedMovieId) setSelectedMovieId(mList[0].id);
      if (tList.length > 0 && !selectedTheatreId) {
        setSelectedTheatreId(tList[0].id);
        if (tList[0].screens?.length > 0) {
          setSelectedScreenId(tList[0].screens[0].id);
        }
      }
    } catch (err) {
      console.error('[FETCH SHOWS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentTheatre = theatres.find((t) => t.id === selectedTheatreId);
  const availableScreens = currentTheatre?.screens || [];

  const handleTheatreChange = (theatreId) => {
    setSelectedTheatreId(theatreId);
    const th = theatres.find((t) => t.id === theatreId);
    if (th?.screens?.length > 0) {
      setSelectedScreenId(th.screens[0].id);
    } else {
      setSelectedScreenId('');
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const payload = {
        movie_id: selectedMovieId,
        screen_id: selectedScreenId,
        starts_at: startDateTime.toISOString(),
        ends_at: endDateTime.toISOString(),
        language,
        format,
        price_by_category: {
          Standard: parseFloat(standardPrice),
          Premium: parseFloat(premiumPrice),
          VIP: parseFloat(vipPrice)
        }
      };

      await api.post('/admin/shows', payload);
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.code === 'SHOW_TIME_OVERLAP' || err.message?.includes('overlap')) {
        setErrorMessage('Cannot schedule show: The screen already has another active show overlapping this time window.');
      } else {
        setErrorMessage(err.message || 'Failed to schedule show.');
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'movie',
      header: 'Movie & Format',
      render: (s) => (
        <div>
          <div className="show-movie-title">{s.movie?.title || 'Unknown Title'}</div>
          <div className="show-details-sub">{s.language} | {s.format}</div>
        </div>
      )
    },
    {
      key: 'theatre',
      header: 'Cinema & Screen',
      render: (s) => (
        <div>
          <div className="show-theatre-title">{s.screen?.theatre?.name}</div>
          <div className="show-details-sub">{s.screen?.name} ({s.screen?.theatre?.city})</div>
        </div>
      )
    },
    {
      key: 'time',
      header: 'Show Schedule',
      render: (s) => (
        <div>
          <div className="show-time-main">{formatDateIST(s.starts_at)}</div>
          <div className="show-details-sub">{formatTimeIST(s.starts_at)} - {formatTimeIST(s.ends_at)} IST</div>
        </div>
      )
    },
    {
      key: 'pricing',
      header: 'Price Range',
      render: (s) => {
        const prices = Object.values(s.price_by_category || {});
        if (prices.length === 0) return '—';
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        return `${formatCurrency(minP)} - ${formatCurrency(maxP)}`;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge variant={s.status === 'scheduled' ? 'success' : 'danger'}>
          {s.status}
        </Badge>
      )
    }
  ];

  return (
    <AdminLayout
      title="Show Scheduling"
      subtitle="Schedule movie screenings across auditorium screens with overlap prevention"
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
          Schedule Show
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={shows}
        loading={loading}
        total={shows.length}
      />

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Screening"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateShow} className="show-form-dialog">
          {errorMessage && (
            <div className="show-overlap-error-box" role="alert">
              <AlertCircle size={20} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          <FormField label="Movie" required>
            <select
              value={selectedMovieId}
              onChange={(e) => {
                setSelectedMovieId(e.target.value);
                const m = movies.find((item) => item.id === e.target.value);
                if (m) {
                  setDurationMinutes(m.duration_minutes || 120);
                  setLanguage(m.language || 'Hindi');
                }
              }}
              required
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.language} - {m.duration_minutes}m)
                </option>
              ))}
            </select>
          </FormField>

          <div className="form-row-grid">
            <FormField label="Cinema Theatre" required>
              <select
                value={selectedTheatreId}
                onChange={(e) => handleTheatreChange(e.target.value)}
                required
              >
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Screen" required>
              <select
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
                required
              >
                {availableScreens.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.screen_type} - {sc.total_seats} seats)
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row-grid">
            <FormField label="Date" required>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>

            <FormField label="Start Time" required>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="form-row-grid">
            <FormField label="Language" required>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Screen Format" required>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="2D">2D Digital</option>
                <option value="3D">3D Digital</option>
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="4DX">4DX Atmos</option>
              </select>
            </FormField>
          </div>

          <div className="pricing-config-group">
            <label className="form-field-label">Tier Base Pricing (INR)</label>
            <div className="form-row-grid-3">
              <FormField label="Standard">
                <input
                  type="number"
                  min="50"
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Premium">
                <input
                  type="number"
                  min="50"
                  value={premiumPrice}
                  onChange={(e) => setPremiumPrice(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="VIP / Recliner">
                <input
                  type="number"
                  min="50"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(e.target.value)}
                  required
                />
              </FormField>
            </div>
          </div>

          <div className="modal-actions-footer">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
