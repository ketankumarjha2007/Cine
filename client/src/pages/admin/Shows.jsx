import React, { useState, useEffect } from 'react';
import { Plus, Edit2, AlertCircle, Filter } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDateIST, formatTimeIST, formatCurrency } from '../../utils/format.js';
import './Shows.css';

const BLANK_FORM = {
  selectedMovieId: '',
  selectedTheatreId: '',
  selectedScreenId: '',
  startDate: new Date().toISOString().split('T')[0],
  startTime: '18:00',
  durationMinutes: 120,
  language: 'Hindi',
  format: '2D',
  standardPrice: 250,
  premiumPrice: 350,
  vipPrice: 500,
};

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingShowId, setEditingShowId] = useState(null);

  // Shared form state (used by both create and edit)
  const [form, setForm] = useState({ ...BLANK_FORM });

  // Show filter: show expired or not
  const [showExpired, setShowExpired] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/admin/shows'),
        api.get('/admin/movies', { params: { limit: 100 } }),
        api.get('/admin/theatres'),
      ]);

      const mList = moviesRes.data.movies || [];
      const tList = theatresRes.data.theatres || [];
      setShows(showsRes.data.shows || []);
      setMovies(mList);
      setTheatres(tList);

      // Set sane defaults only on first load
      setForm((prev) => ({
        ...prev,
        selectedMovieId: prev.selectedMovieId || (mList[0]?.id ?? ''),
        selectedTheatreId: prev.selectedTheatreId || (tList[0]?.id ?? ''),
        selectedScreenId: prev.selectedScreenId || (tList[0]?.screens?.[0]?.id ?? ''),
      }));
    } catch (err) {
      console.error('[FETCH SHOWS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScreensForTheatre = (theatreId) => {
    const th = theatres.find((t) => t.id === theatreId);
    return th?.screens || [];
  };

  const handleTheatreChange = (theatreId) => {
    const screens = getScreensForTheatre(theatreId);
    setField('selectedTheatreId', theatreId);
    setField('selectedScreenId', screens[0]?.id ?? '');
  };

  // ── Open EDIT modal ──────────────────────────────────────────────────────────
  const handleOpenEdit = (show) => {
    setErrorMessage('');
    setEditingShowId(show.id);

    const startsAt = new Date(show.starts_at);
    const endsAt = new Date(show.ends_at);
    const durationMs = endsAt - startsAt;
    const dur = Math.round(durationMs / 60000) || 120;

    const dateStr = startsAt.toISOString().split('T')[0];
    const timeStr = `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`;

    const theatreId = show.screen?.theatre?.id ?? '';
    const screenId = show.screen?.id ?? '';

    const prices = show.price_by_category || {};

    setForm({
      selectedMovieId: show.movie_id ?? show.movie?.id ?? '',
      selectedTheatreId: theatreId,
      selectedScreenId: screenId,
      startDate: dateStr,
      startTime: timeStr,
      durationMinutes: dur,
      language: show.language || 'Hindi',
      format: show.format || '2D',
      standardPrice: prices.Standard ?? prices.standard ?? 250,
      premiumPrice: prices.Premium ?? prices.premium ?? 350,
      vipPrice: prices.VIP ?? prices.vip ?? 500,
    });

    setEditModalOpen(true);
  };

  // ── Build payload from shared form state ─────────────────────────────────────
  const buildPayload = () => {
    const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(form.durationMinutes) * 60000);
    return {
      movie_id: form.selectedMovieId,
      screen_id: form.selectedScreenId,
      starts_at: startDateTime.toISOString(),
      ends_at: endDateTime.toISOString(),
      language: form.language,
      format: form.format,
      price_by_category: {
        Standard: parseFloat(form.standardPrice),
        Premium: parseFloat(form.premiumPrice),
        VIP: parseFloat(form.vipPrice),
      },
    };
  };

  // ── Create show ───────────────────────────────────────────────────────────────
  const handleCreateShow = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);
    try {
      await api.post('/admin/shows', buildPayload());
      setCreateModalOpen(false);
      setForm({ ...BLANK_FORM });
      fetchData();
    } catch (err) {
      if (err.code === 'SHOW_TIME_OVERLAP' || err.message?.includes('overlap')) {
        setErrorMessage('Cannot schedule: the screen already has another show overlapping this time window.');
      } else {
        setErrorMessage(err.message || 'Failed to schedule show.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Update show ───────────────────────────────────────────────────────────────
  const handleUpdateShow = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);
    try {
      await api.put(`/admin/shows/${editingShowId}`, buildPayload());
      setEditModalOpen(false);
      setEditingShowId(null);
      fetchData();
    } catch (err) {
      if (err.code === 'SHOW_TIME_OVERLAP' || err.message?.includes('overlap')) {
        setErrorMessage('Cannot update: the screen already has another show overlapping this time window.');
      } else {
        setErrorMessage(err.message || 'Failed to update show.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Filter shows ──────────────────────────────────────────────────────────────
  const now = new Date();
  const visibleShows = showExpired
    ? shows
    : shows.filter((s) => new Date(s.starts_at) > now);

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'movie',
      header: 'Movie & Format',
      render: (s) => (
        <div>
          <div className="show-movie-title">{s.movie?.title || 'Unknown Title'}</div>
          <div className="show-details-sub">{s.language} | {s.format}</div>
        </div>
      ),
    },
    {
      key: 'theatre',
      header: 'Cinema & Screen',
      render: (s) => (
        <div>
          <div className="show-theatre-title">{s.screen?.theatre?.name}</div>
          <div className="show-details-sub">
            {s.screen?.name} ({s.screen?.theatre?.city})
          </div>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Show Schedule',
      render: (s) => {
        const isExpired = new Date(s.starts_at) < now;
        return (
          <div className={isExpired ? 'show-expired-row' : ''}>
            <div className="show-time-main">{formatDateIST(s.starts_at)}</div>
            <div className="show-details-sub">
              {formatTimeIST(s.starts_at)} – {formatTimeIST(s.ends_at)} IST
            </div>
          </div>
        );
      },
    },
    {
      key: 'pricing',
      header: 'Price Range',
      render: (s) => {
        const prices = Object.values(s.price_by_category || {});
        if (prices.length === 0) return '—';
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        return `${formatCurrency(minP)} – ${formatCurrency(maxP)}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        const isExpired = new Date(s.starts_at) < now;
        if (isExpired) {
          return <Badge variant="secondary">Expired</Badge>;
        }
        return (
          <Badge variant={s.status === 'scheduled' ? 'success' : 'danger'}>
            {s.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (s) => {
        const isExpired = new Date(s.starts_at) < now;
        if (isExpired) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(s)}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  // ── Shared form JSX ───────────────────────────────────────────────────────────
  const renderForm = (onSubmit, submitLabel) => {
    const screens = getScreensForTheatre(form.selectedTheatreId);
    return (
      <form onSubmit={onSubmit} className="show-form-dialog">
        {errorMessage && (
          <div className="show-overlap-error-box" role="alert">
            <AlertCircle size={20} className="error-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        <FormField label="Movie" required>
          <select
            value={form.selectedMovieId}
            onChange={(e) => {
              setField('selectedMovieId', e.target.value);
              const m = movies.find((item) => item.id === e.target.value);
              if (m) {
                setField('durationMinutes', m.duration_minutes || 120);
                setField('language', m.language || 'Hindi');
              }
            }}
            required
          >
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.language} – {m.duration_minutes}m)
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-row-grid">
          <FormField label="Cinema Theatre" required>
            <select
              value={form.selectedTheatreId}
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
              value={form.selectedScreenId}
              onChange={(e) => setField('selectedScreenId', e.target.value)}
              required
            >
              {screens.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name} ({sc.screen_type} – {sc.total_seats} seats)
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="form-row-grid">
          <FormField label="Date" required>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </FormField>

          <FormField label="Start Time" required>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setField('startTime', e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="form-row-grid">
          <FormField label="Language" required>
            <input
              type="text"
              value={form.language}
              onChange={(e) => setField('language', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Screen Format" required>
            <select
              value={form.format}
              onChange={(e) => setField('format', e.target.value)}
            >
              <option value="2D">2D Digital</option>
              <option value="3D">3D Digital</option>
              <option value="IMAX 3D">IMAX 3D</option>
              <option value="4DX">4DX Atmos</option>
            </select>
          </FormField>
        </div>

        <div className="form-row-grid">
          <FormField label="Duration (minutes)" required>
            <input
              type="number"
              min="30"
              max="360"
              value={form.durationMinutes}
              onChange={(e) => setField('durationMinutes', e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="pricing-config-group">
          <label className="form-field-label">Tier Base Pricing (INR)</label>
          <div className="form-row-grid-3">
            <FormField label="Standard">
              <input
                type="number"
                min="50"
                value={form.standardPrice}
                onChange={(e) => setField('standardPrice', e.target.value)}
                required
              />
            </FormField>

            <FormField label="Premium">
              <input
                type="number"
                min="50"
                value={form.premiumPrice}
                onChange={(e) => setField('premiumPrice', e.target.value)}
                required
              />
            </FormField>

            <FormField label="VIP / Recliner">
              <input
                type="number"
                min="50"
                value={form.vipPrice}
                onChange={(e) => setField('vipPrice', e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        <div className="modal-actions-footer">
          <Button
            variant="secondary"
            onClick={() => {
              setCreateModalOpen(false);
              setEditModalOpen(false);
              setErrorMessage('');
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <AdminLayout
      title="Show Scheduling"
      subtitle="Schedule and manage movie screenings across auditorium screens"
      actions={
        <div className="shows-header-actions">
          <Button
            variant={showExpired ? 'primary' : 'secondary'}
            size="sm"
            icon={Filter}
            onClick={() => setShowExpired((v) => !v)}
          >
            {showExpired ? 'Hide Expired' : 'Show Expired'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setErrorMessage('');
              setForm({ ...BLANK_FORM });
              setCreateModalOpen(true);
            }}
          >
            Schedule Show
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={visibleShows}
        loading={loading}
        total={visibleShows.length}
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setErrorMessage(''); }}
        title="Schedule New Screening"
        maxWidth="680px"
      >
        {renderForm(handleCreateShow, 'Confirm Schedule')}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingShowId(null); setErrorMessage(''); }}
        title="Edit Show Scheduling"
        maxWidth="680px"
      >
        {renderForm(handleUpdateShow, 'Save Changes')}
      </Modal>
    </AdminLayout>
  );
}
