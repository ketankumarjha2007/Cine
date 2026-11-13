import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import './Signup.css';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !email || !password) {
      setErrorMsg('Full name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        fullName,
        email,
        phone,
        password
      });

      setSuccessMsg('Account registered successfully. If email confirmation is enabled on your instance, please check your inbox.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg('');
    try {
      setOauthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-up could not be initiated.');
      setOauthLoading(false);
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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join CineTicket to reserve seats, track bookings, and access exclusive previews</p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert" role="alert">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="auth-success-alert" role="alert">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Sign-In */}
          <button
            type="button"
            className="oauth-btn"
            onClick={handleGoogleSignUp}
            disabled={oauthLoading || loading}
          >
            <svg className="oauth-btn-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{oauthLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">Full name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  id="signup-name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Email address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-phone" className="form-label">Phone number (optional)</label>
              <div className="input-with-icon">
                <Phone size={16} className="field-icon" />
                <input
                  id="signup-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="signup-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              Sign Up
            </Button>
          </form>

          <div className="auth-card-footer">
            <p className="auth-switch-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
