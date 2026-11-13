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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { signUp } = useAuth();
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
