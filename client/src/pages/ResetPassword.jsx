import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import './ResetPassword.css';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell showFooter={false}>
      <div className="auth-page-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <Link to="/" className="auth-brand">
              <Film size={28} className="auth-brand-icon" />
              <span>CineTicket</span>
            </Link>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Create a secure new password for your CineTicket account</p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert" role="alert">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="reset-confirmation-box">
              <CheckCircle size={48} className="reset-success-icon" />
              <h3 className="reset-success-title">Password updated</h3>
              <p className="reset-success-desc">
                Your password has been changed successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-new-password" className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    id="confirm-new-password"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                icon={ArrowRight}
                size="lg"
              >
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
