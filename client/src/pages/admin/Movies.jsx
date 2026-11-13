import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Archive, Film } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import Badge from '../../components/common/Badge.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import './Movies.css';

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState(120);
  const [certificate, setCertificate] = useState('UA');
  const [status, setStatus] = useState('now_showing');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerKey, setTrailerKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/movies', { params });
      setMovies(res.data.movies || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('[FETCH MOVIES ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page, search, statusFilter]);

  const handleImportTMDB = async () => {
    try {
      setImporting(true);
      const res = await api.post('/admin/movies/import');
      alert(res.data.message || 'Movies imported successfully from TMDB');
      fetchMovies();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenEdit = (movie = null) => {
    setCurrentMovie(movie);
    if (movie) {
      setTitle(movie.title || '');
      setOverview(movie.overview || '');
      setLanguage(movie.language || 'English');
      setDuration(movie.duration_minutes || 120);
      setCertificate(movie.certificate || 'UA');
      setStatus(movie.status || 'now_showing');
      setPosterUrl(movie.poster_url || '');
      setBackdropUrl(movie.backdrop_url || '');
      setTrailerKey(movie.trailer_key || '');
    } else {
      setTitle('');
      setOverview('');
      setLanguage('English');
      setDuration(120);
      setCertificate('UA');
      setStatus('now_showing');
      setPosterUrl('');
      setBackdropUrl('');
      setTrailerKey('');
    }
    setEditModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        overview,
        language,
        duration_minutes: parseInt(duration, 10),
        certificate,
        status,
        poster_url: posterUrl || null,
        backdrop_url: backdropUrl || null,
        trailer_key: trailerKey || null
      };

      if (currentMovie) {
        await api.put(`/admin/movies/${currentMovie.id}`, payload);
      } else {
        await api.post('/admin/movies', payload);
      }

      setEditModalOpen(false);
      fetchMovies();
    } catch (err) {
      alert(`Failed to save movie: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (movie) => {
    if (!confirm(`Are you sure you want to archive "${movie.title}"?`)) return;
    try {
      await api.put(`/admin/movies/${movie.id}`, { status: 'archived' });
      fetchMovies();
    } catch (err) {
      alert(`Archive failed: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'poster_url',
      header: 'Poster',
      render: (m) => (
        <div className="movie-table-poster">
          {m.poster_url ? (
            <img src={m.poster_url} alt={m.title} loading="lazy" />
          ) : (
            <div className="poster-placeholder"><Film size={18} /></div>
          )}
        </div>
      )
    },
    {
      key: 'title',
      header: 'Title & Language',
      render: (m) => (
        <div>
          <div className="movie-table-title">{m.title}</div>
          <div className="movie-table-sub">{m.language} | {m.certificate} | {m.duration_minutes}m</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => {
        const variant = m.status === 'now_showing' ? 'success' : m.status === 'upcoming' ? 'primary' : 'neutral';
        return <Badge variant={variant}>{m.status.replace('_', ' ')}</Badge>;
      }
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (m) => (m.rating ? `${m.rating} / 10` : '—')
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="table-actions-cell">
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleOpenEdit(m)}>
            Edit
          </Button>
          {m.status !== 'archived' && (
            <Button variant="ghost" size="sm" icon={Archive} onClick={() => handleArchive(m)}>
              Archive
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Movie Catalog"
      subtitle="Manage movie library and import now-playing titles directly from TMDB"
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleImportTMDB}
            loading={importing}
          >
            Import TMDB (India)
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenEdit(null)}
          >
            Add Movie
          </Button>
        </>
      }
    >
      <div className="movie-filter-pills">
        <button
          type="button"
          className={`filter-pill ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-pill ${statusFilter === 'now_showing' ? 'active' : ''}`}
          onClick={() => setStatusFilter('now_showing')}
        >
          Now Showing
        </button>
        <button
          type="button"
          className={`filter-pill ${statusFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setStatusFilter('upcoming')}
        >
          Coming Soon
        </button>
        <button
          type="button"
          className={`filter-pill ${statusFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setStatusFilter('archived')}
        >
          Archived
        </button>
      </div>

      <DataTable
        columns={columns}
        data={movies}
        loading={loading}
        total={total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        searchPlaceholder="Search movies by title..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Create / Edit Movie Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={currentMovie ? 'Edit Movie Details' : 'Add New Movie'}
        maxWidth="620px"
      >
        <form onSubmit={handleSaveMovie} className="movie-form-dialog">
          <FormField label="Movie Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inception"
              required
            />
          </FormField>

          <FormField label="Overview / Synopsis">
            <textarea
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Movie synopsis..."
            />
          </FormField>

          <div className="form-row-grid">
            <FormField label="Language" required>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Duration (minutes)" required>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                required
              />
            </FormField>
          </div>

          <div className="form-row-grid">
            <FormField label="Certificate">
              <select value={certificate} onChange={(e) => setCertificate(e.target.value)}>
                <option value="U">U (Universal)</option>
                <option value="UA">UA (Parental Guidance)</option>
                <option value="A">A (Adults Only)</option>
                <option value="S">S (Specialist)</option>
              </select>
            </FormField>

            <FormField label="Status" required>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="now_showing">Now Showing</option>
                <option value="upcoming">Upcoming</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>

          <FormField label="YouTube Trailer Key" helpText="The video ID (e.g., dQw4w9WgXcQ)">
            <input
              type="text"
              value={trailerKey}
              onChange={(e) => setTrailerKey(e.target.value)}
              placeholder="e.g. dQw4w9WgXcQ"
            />
          </FormField>

          <div className="form-row-grid">
            <FormField label="Poster Image URL or Upload">
              <ImageUpload
                value={posterUrl}
                onChange={setPosterUrl}
                folder="posters"
                label="Upload Poster"
              />
            </FormField>

            <FormField label="Backdrop Image URL or Upload">
              <ImageUpload
                value={backdropUrl}
                onChange={setBackdropUrl}
                folder="backdrops"
                label="Upload Backdrop"
              />
            </FormField>
          </div>

          <div className="modal-actions-footer">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save Movie
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
