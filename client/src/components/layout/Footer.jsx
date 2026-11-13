import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, FileText, Lock, RefreshCw, Mail, PhoneCall, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import './Footer.css';

const POLICY_DATA = {
  terms: {
    title: 'Terms & Conditions',
    icon: FileText,
    content: (
      <div className="policy-modal-body">
        <p className="policy-lead">
          By accessing or using CineTicket, you agree to comply with and be bound by the following terms and conditions governing ticket bookings, admissions, and platform usage.
        </p>

        <section className="policy-section">
          <h4>1. Ticket Booking and Admission</h4>
          <ul>
            <li>Admission to the cinema auditorium is strictly subject to the presentation of a valid digital or printed booking receipt and a recognized government photo ID.</li>
            <li>Age-restricted films (e.g., A-rated) require patrons to be 18 years or older. Entry will be denied without refund if age verification fails at the cinema box office.</li>
            <li>Seat allocations are guaranteed as selected during the checkout process and verified on the digital ticket pass.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>2. Cinema Conduct & Regulations</h4>
          <ul>
            <li>Outside food and beverages are strictly prohibited inside cinema multiplex auditoriums per cinema management policies.</li>
            <li>Recording devices, cameras, and unauthorized photography are legally prohibited and violate anti-piracy laws.</li>
            <li>Cinema operators reserve the right of admission and may refuse entry or eject individuals displaying disruptive conduct.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>3. Show Timing & Force Majeure</h4>
          <ul>
            <li>Show schedules are determined in coordination with partner cinema exhibitors. In the rare event of technical failure, power disruption, or exhibitor cancellation, patrons will be entitled to a full refund.</li>
          </ul>
        </section>
      </div>
    )
  },
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    content: (
      <div className="policy-modal-body">
        <p className="policy-lead">
          CineTicket is dedicated to safeguarding your personal privacy and maintaining strict confidentiality regarding user account details, transaction records, and communication preferences.
        </p>

        <section className="policy-section">
          <h4>1. Information We Collect</h4>
          <ul>
            <li><strong>Account Details:</strong> Full name, verified email address, and optional phone number to deliver tickets, invoices, and cancellation notices.</li>
            <li><strong>Location Data:</strong> Geolocation coordinates (with your permission) to calculate distances and sort the closest cinema theatres.</li>
            <li><strong>Booking History:</strong> Movie titles, auditorium screens, booked seats, and payment references for bill retrieval and verification.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>2. Data Security & Storage</h4>
          <ul>
            <li>Your data is protected by Supabase Postgres enterprise encryption and strict Row Level Security (RLS) policies.</li>
            <li>We never sell, rent, or trade your personal information with third-party advertisers or unauthorized brokers.</li>
            <li>Financial transactions are handled via Razorpay’s encrypted channels; CineTicket never stores credit card, debit card, or UPI credentials on its servers.</li>
          </ul>
        </section>
      </div>
    )
  },
  cancellation: {
    title: 'Cancellation & Refund Policy',
    icon: RefreshCw,
    content: (
      <div className="policy-modal-body">
        <p className="policy-lead">
          We understand that schedules change. CineTicket provides a transparent, automated cancellation and refund mechanism for eligible confirmed bookings.
        </p>

        <section className="policy-section">
          <h4>1. Cancellation Eligibility Window</h4>
          <ul>
            <li>Bookings can be cancelled up to <strong>2 hours prior</strong> to the scheduled showtime directly through the <em>My Bookings</em> dashboard.</li>
            <li>Once the show has started or within 2 hours of showtime, cancellations cannot be processed as seats have been reserved and reported to cinema exhibitors.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>2. Refund Process & Timelines</h4>
          <ul>
            <li>Upon successful cancellation, your reserved seats are released back to the general public inventory in real time.</li>
            <li>The full ticket subtotal is refunded directly back to your original source of payment (Credit Card, Debit Card, Net Banking, or UPI) via Razorpay.</li>
            <li>Refunds typically reflect in your bank account or card balance within <strong>5 to 7 business days</strong>.</li>
            <li>Convenience fees and government taxes (if applicable) are non-refundable once the transaction has been executed.</li>
          </ul>
        </section>
      </div>
    )
  },
  security: {
    title: 'Payment Security',
    icon: Lock,
    content: (
      <div className="policy-modal-body">
        <p className="policy-lead">
          CineTicket ensures bank-grade end-to-end security for all financial payments, seat holds, and transactional interactions.
        </p>

        <section className="policy-section">
          <h4>1. 256-Bit SSL/TLS Encryption</h4>
          <ul>
            <li>All communication between your browser and our servers is secured with strict Transport Layer Security (TLS 1.3 / 256-bit encryption).</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>2. PCI-DSS Level 1 Compliance</h4>
          <ul>
            <li>Payment gateway processing is powered by <strong>Razorpay</strong>, certified at PCI-DSS Level 1 compliance (the highest standard in the global payment cards industry).</li>
            <li>Card transactions support Two-Factor Authentication (3D Secure OTP) mandated by the Reserve Bank of India.</li>
            <li>Server-side HMAC-SHA256 cryptographic signatures prevent payment tampering or unauthorized order manipulation.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h4>3. Double Booking Immunity</h4>
          <ul>
            <li>Transactional Postgres seat holding with partial unique indexes ensures race-condition protection, preventing any duplicate seat reservations.</li>
          </ul>
        </section>
      </div>
    )
  }
};

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null);

  const policy = activePolicy ? POLICY_DATA[activePolicy] : null;
  const PolicyIcon = policy?.icon || FileText;

  return (
    <>
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
                <li>
                  <button
                    type="button"
                    className="footer-policy-btn"
                    onClick={() => setActivePolicy('terms')}
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-policy-btn"
                    onClick={() => setActivePolicy('privacy')}
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-policy-btn"
                    onClick={() => setActivePolicy('cancellation')}
                  >
                    Cancellation & Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-policy-btn"
                    onClick={() => setActivePolicy('security')}
                  >
                    Payment Security
                  </button>
                </li>
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

      {/* Interactive Policy Modal */}
      {policy && (
        <Modal
          isOpen={Boolean(activePolicy)}
          onClose={() => setActivePolicy(null)}
          title={policy.title}
          size="lg"
        >
          <div className="policy-modal-wrapper">
            <div className="policy-modal-header-badge">
              <PolicyIcon size={20} className="policy-badge-icon" />
              <span>Official CineTicket Customer Policy</span>
            </div>
            {policy.content}
            <div className="policy-modal-footer">
              <Button
                variant="primary"
                onClick={() => setActivePolicy(null)}
              >
                I Understand
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
