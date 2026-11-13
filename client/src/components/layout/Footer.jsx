import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, HelpCircle, PhoneCall, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="container footer-container">
        <div className="footer-top">
          {/* Brand & Mission */}
          <div className="footer-col footer-brand-col">
            <div className="footer-brand">
              <Film className="footer-logo-icon" size={24} />
              <span className="footer-logo-text">CineTicket</span>
            </div>
            <p className="footer-tagline">
              Premium movie ticket booking experience. Seamless seat reservations, instant digital passes, and guaranteed secure payments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Now Showing Movies</Link></li>
              <li><Link to="/theatres">Cinema Theatres</Link></li>
              <li><Link to="/my-bookings">My Bookings</Link></li>
              <li><Link to="/profile">Account Settings</Link></li>
            </ul>
          </div>

          {/* Help & Policies */}
          <div className="footer-col">
            <h4 className="footer-heading">Policies & Support</h4>
            <ul className="footer-links">
              <li><a href="#terms">Terms & Conditions</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#cancellation">Cancellation & Refund Policy</a></li>
              <li><a href="#security">Payment Security</a></li>
            </ul>
          </div>

          {/* Support Information */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Care</h4>
            <div className="footer-contact-item">
              <Mail size={16} className="contact-icon" />
              <span>support@cineticket.com</span>
            </div>
            <div className="footer-contact-item">
              <PhoneCall size={16} className="contact-icon" />
              <span>1800-123-CINETICKET (Toll Free)</span>
            </div>
            <p className="footer-hours">Available daily: 09:00 AM - 11:00 PM IST</p>
          </div>
        </div>

        {/* TMDB Attribution & Copyright */}
        <div className="footer-bottom">
          <div className="tmdb-attribution-block">
            <div className="tmdb-badge-pill">TMDB</div>
            <p className="tmdb-legal-notice">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>

          <p className="footer-copyright">
            Copyright {new Date().getFullYear()} CineTicket Inc. All rights reserved. Built for cinema enthusiasts.
          </p>
        </div>
      </div>
    </footer>
  );
}
