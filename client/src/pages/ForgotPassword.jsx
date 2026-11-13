import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to process password reset request.');
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
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">
              Enter your registered email and we will send you a password recovery link
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert" role="alert">
              {errorMsg}
            </div>
          )}

          {submitted ? (
            <div className="reset-confirmation-box">
              <CheckCircle size={48} className="reset-success-icon" />
              <h3 className="reset-success-title">Recovery link dispatched</h3>
              <p className="reset-success-desc">
                If an account exists for <strong className="text-highlight">{email}</strong>, you will receive password reset instructions shortly.
              </p>
              <Link to="/login" className="back-to-login-btn">
                <Button variant="secondary" fullWidth icon={ArrowLeft}>
                  Return to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="forgot-email" className="form-label">Email address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                Send Reset Link
              </Button>

              <div className="auth-card-footer">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
