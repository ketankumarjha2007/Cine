import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Ticket, Home } from 'lucide-react';
import api from '../services/api.js';
import { generateBill } from '../utils/generateBill.js';
import PageShell from '../components/layout/PageShell.jsx';
import TicketCard from '../components/booking/TicketCard.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import './BookingConfirmation.css';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchConfirmation() {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.booking);
      } catch (err) {
        console.error('[LOAD CONFIRMATION ERROR]', err);
        alert(`Failed to load booking: ${err.message}`);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchConfirmation();
  }, [bookingId, navigate]);

  const handleDownloadBill = async () => {
    if (!booking) return;
    try {
      setDownloading(true);
      await generateBill(booking);
    } catch (err) {
      console.error('[BILL GENERATION ERROR]', err);
      alert(`Failed to generate bill PDF: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="confirmation-loader">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container confirmation-page-container">
        {/* Success Banner */}
        <div className="confirmation-success-banner">
          <CheckCircle2 size={48} className="success-banner-icon" />
          <h1 className="success-banner-title">Booking Confirmed</h1>
          <p className="success-banner-subtitle">
            Your movie tickets are reserved. An email confirmation has been dispatched with booking details.
          </p>
        </div>

        {/* Digital Ticket Pass with QR */}
        <div className="confirmation-ticket-wrapper">
          <TicketCard booking={booking} />
        </div>

        {/* Post-booking Actions */}
        <div className="confirmation-actions-row">
          <Button
            variant="secondary"
            size="lg"
            icon={Download}
            onClick={handleDownloadBill}
            loading={downloading}
          >
            Download Bill (PDF)
          </Button>

          <Link to="/my-bookings">
            <Button variant="primary" size="lg" icon={Ticket}>
              Go to My Bookings
            </Button>
          </Link>

          <Link to="/">
            <Button variant="outline" size="lg" icon={Home}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
