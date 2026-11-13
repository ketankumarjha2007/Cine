import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabase.js';
import Spinner from '../common/Spinner.jsx';
import './ImageUpload.css';

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  label = 'Upload Image'
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPG, PNG, WebP) are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onChange(publicUrl);
    } catch (err) {
      console.error('[STORAGE UPLOAD ERROR]', err);
      setError(err.message || 'Failed to upload image to Supabase Storage');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="image-upload-root">
      {value ? (
        <div className="image-preview-wrapper">
          <img src={value} alt="Preview" className="image-preview" />
          <button
            type="button"
            className="image-clear-btn"
            onClick={handleClear}
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="image-upload-dropzone">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
          {uploading ? (
            <div className="upload-state-loading">
              <Spinner size="md" />
              <span className="upload-status-text">Uploading media...</span>
            </div>
          ) : (
            <div className="upload-state-idle">
              <Upload size={24} className="upload-icon" />
              <span className="upload-label-text">{label}</span>
              <span className="upload-hint-text">PNG, JPG or WebP up to 5MB</span>
            </div>
          )}
        </label>
      )}

      {error && <span className="image-upload-error">{error}</span>}
    </div>
  );
}
