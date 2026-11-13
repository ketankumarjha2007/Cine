import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import './Profile.css';

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({
        full_name: fullName,
        phone
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="container profile-page-container">
        <div className="profile-header">
          <h1 className="profile-page-title">Account Settings</h1>
          <p className="profile-page-subtitle">Manage your personal information and contact preferences</p>
        </div>

        <div className="profile-card">
          <div className="profile-badge-row">
            <div className="profile-avatar">
              <User size={32} />
            </div>
            <div>
              <h2 className="profile-name-heading">{profile?.full_name || 'Valued User'}</h2>
              <div className="profile-role-status">
                <Badge variant={profile?.role === 'admin' ? 'rating' : 'neutral'}>
                  {profile?.role === 'admin' ? 'Administrator' : 'Standard Member'}
                </Badge>
              </div>
            </div>
          </div>

          {message && (
            <div className="profile-alert success">
              <Check size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="profile-alert error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="prof-email" className="form-label">Email Address (Read-only)</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  id="prof-email"
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-name" className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-phone" className="form-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="field-icon" />
                <input
                  id="prof-phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="profile-actions">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
