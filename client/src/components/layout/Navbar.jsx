import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, MapPin, ChevronDown, User, LogOut, Shield, Menu, X, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocationContext } from '../../context/LocationContext.jsx';
import LocationPicker from '../theatres/LocationPicker.jsx';
import Button from '../common/Button.jsx';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { selectedCity } = useLocationContext();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('[AUTH ERROR] Sign out error:', err);
    }
  };

  return (
    <>
      <header className="navbar-root">
        <div className="navbar-container container">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand">
            <Film className="navbar-brand-icon" size={24} />
            <span className="navbar-brand-text">CineTicket</span>
          </Link>

          {/* City Selector */}
          <button
            type="button"
            className="navbar-location-btn"
            onClick={() => setLocationPickerOpen(true)}
            aria-label={`Current location: ${selectedCity}. Click to change city`}
          >
            <MapPin size={16} className="location-pin-icon" />
            <span className="location-city-name">{selectedCity}</span>
            <ChevronDown size={14} className="location-chevron" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="navbar-nav md-flex">
            <Link to="/" className="nav-link">Movies</Link>
            <Link to="/theatres" className="nav-link">Theatres</Link>
            {user && (
              <Link to="/my-bookings" className="nav-link">
                My Bookings
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="nav-link nav-link-admin">
                <Shield size={14} />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* Right Action / Auth */}
          <div className="navbar-actions md-flex">
            {user ? (
              <div className="user-menu-wrapper">
                <button
                  type="button"
                  className="user-profile-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                >
                  <User size={16} />
                  <span className="user-profile-name">{profile?.full_name || 'Account'}</span>
                  <ChevronDown size={14} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="user-name-display">{profile?.full_name || 'User'}</p>
                      <p className="user-email-display">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={14} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Ticket size={14} />
                      <span>My Bookings</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="user-dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Shield size={14} />
                        <span>Admin Console</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      className="user-dropdown-item user-dropdown-logout"
                      onClick={handleSignOut}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="navbar-hamburger mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer mobile-only">
            <nav className="mobile-drawer-nav">
              <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Movies
              </Link>
              <Link to="/theatres" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Theatres
              </Link>
              {user ? (
                <>
                  <Link to="/my-bookings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    My Bookings
                  </Link>
                  <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="mobile-nav-link text-admin" onClick={() => setMobileMenuOpen(false)}>
                      Admin Console
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mobile-nav-link mobile-logout-btn"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="mobile-auth-cta">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Location Picker Dialog */}
      <LocationPicker
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
    </>
  );
}
