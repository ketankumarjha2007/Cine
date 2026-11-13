import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Image } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/admin/FormField.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import Badge from '../../components/common/Badge.jsx';
import './Banners.css';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/banners');
      setBanners(res.data.banners || []);
    } catch (err) {
      console.error('[FETCH BANNERS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenEdit = (b = null) => {
    setCurrentBanner(b);
    if (b) {
      setTitle(b.title || '');
      setSubtitle(b.subtitle || '');
      setImageUrl(b.image_url || '');
      setLinkUrl(b.link_url || '');
      setSortOrder(b.sort_order || 0);
      setActive(b.active ?? true);
    } else {
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      setLinkUrl('');
      setSortOrder(banners.length);
      setActive(true);
    }
    setModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please upload or specify a banner image URL');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        subtitle,
        image_url: imageUrl,
        link_url: linkUrl || null,
        sort_order: parseInt(sortOrder, 10) || 0,
        active
      };

      if (currentBanner) {
        await api.put(`/admin/banners/${currentBanner.id}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }

      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      alert(`Failed to save banner: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    try {
      await api.delete(`/admin/banners/${b.id}`);
      fetchBanners();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'image_url',
      header: 'Preview',
      render: (b) => (
        <div className="banner-table-preview">
          <img src={b.image_url} alt={b.title} loading="lazy" />
        </div>
      )
    },
    {
      key: 'title',
      header: 'Title & Subtitle',
      render: (b) => (
        <div>
          <div className="banner-title-text">{b.title}</div>
          {b.subtitle && <div className="banner-subtitle-text">{b.subtitle}</div>}
        </div>
      )
    },
    {
      key: 'sort_order',
      header: 'Order',
      render: (b) => b.sort_order
    },
    {
      key: 'active',
      header: 'Status',
      render: (b) => (
        <Badge variant={b.active ? 'success' : 'neutral'}>
          {b.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div className="table-actions-cell">
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleOpenEdit(b)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(b)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Promotional Banners"
      subtitle="Manage home page carousel slides, promotional displays, and deep links"
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => handleOpenEdit(null)}>
          Add Banner
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={banners}
        loading={loading}
        total={banners.length}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentBanner ? 'Edit Banner' : 'Create Banner'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveBanner} className="banner-form-dialog">
          <FormField label="Banner Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exclusive IMAX Experience"
              required
            />
          </FormField>

          <FormField label="Subtitle / Tagline">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Advanced bookings now open across all screens"
            />
          </FormField>

          <FormField label="Banner Image (High Resolution Landscape)" required>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder="banners"
              label="Upload Banner Graphic"
            />
          </FormField>

          <div className="form-row-grid">
            <FormField label="Link URL (Optional)">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /theatres or /movies"
              />
            </FormField>

            <FormField label="Display Order">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
              />
            </FormField>
          </div>

          <div className="banner-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Active and visible on home carousel</span>
            </label>
          </div>

          <div className="modal-actions-footer">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save Banner
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
