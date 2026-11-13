import React, { useState, useEffect } from 'react';
import { Ticket, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDateIST, formatTimeIST, formatCurrency } from '../../utils/format.js';
import './Bookings.css';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('[FETCH ADMIN BOOKINGS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, search, statusFilter]);

  const handleViewDetails = async (booking) => {
    try {
      setFetchingDetail(true);
      const res = await api.get(`/admin/bookings/${booking.id}`);
      setSelectedBooking(res.data.booking);
      setDetailModalOpen(true);
    } catch (err) {
      alert(`Failed to load booking details: ${err.message}`);
    } finally {
      setFetchingDetail(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      case 'EXPIRED': return 'neutral';
      default: return 'neutral';
    }
  };

  const columns = [
    {
      key: 'booking_code',
      header: 'Booking Code',
      render: (b) => (
        <span className="booking-code-pill">{b.booking_code}</span>
      )
    },
    {
      key: 'movie',
      header: 'Movie & Theatre',
      render: (b) => (
        <div>
          <div className="booking-movie-text">{b.shows?.movie?.title || 'Movie'}</div>
          <div className="booking-theatre-text">
            {b.shows?.screen?.theatre?.name} ({b.shows?.screen?.name})
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={getStatusBadgeVariant(b.status)}>
          {b.status}
        </Badge>
      )
    },
    {
      key: 'total_amount',
      header: 'Total Paid',
      render: (b) => formatCurrency(b.total_amount)
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (b) => `${formatDateIST(b.created_at)} ${formatTimeIST(b.created_at)}`
    },
    {
      key: 'actions',
      header: 'Inspect',
      render: (b) => (
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleViewDetails(b)}>
          View
        </Button>
      )
    }
  ];

  return (
    <AdminLayout
      title="Customer Bookings"
      subtitle="Inspect ticket reservations, seat allocations, and payment verification records"
    >
      <div className="movie-filter-pills">
        {['', 'CONFIRMED', 'PENDING', 'CANCELLED', 'EXPIRED'].map((st) => (
          <button
            key={st}
            type="button"
            className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st ? st : 'All Bookings'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        total={total}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        searchPlaceholder="Search by booking code..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Booking Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Booking #${selectedBooking?.booking_code || ''}`}
        maxWidth="600px"
      >
        {selectedBooking && (
          <div className="booking-inspect-card">
            <div className="inspect-status-banner">
              <Badge variant={getStatusBadgeVariant(selectedBooking.status)} size="md">
                {selectedBooking.status}
              </Badge>
              <span className="inspect-timestamp">
                {formatDateIST(selectedBooking.confirmed_at || selectedBooking.created_at)} at {formatTimeIST(selectedBooking.confirmed_at || selectedBooking.created_at)} IST
              </span>
            </div>

            <div className="inspect-section">
              <h4 className="inspect-section-title">Customer</h4>
              <p className="inspect-line"><strong>Name:</strong> {selectedBooking.customerName}</p>
              <p className="inspect-line"><strong>Email:</strong> {selectedBooking.customerEmail}</p>
            </div>

            <div className="inspect-section">
              <h4 className="inspect-section-title">Film & Cinema</h4>
              <p className="inspect-line">
                <strong>Movie:</strong> {selectedBooking.shows?.movie?.title} ({selectedBooking.shows?.language} | {selectedBooking.shows?.format})
              </p>
              <p className="inspect-line">
                <strong>Cinema:</strong> {selectedBooking.shows?.screen?.theatre?.name}, {selectedBooking.shows?.screen?.theatre?.address}
              </p>
              <p className="inspect-line">
                <strong>Screen:</strong> {selectedBooking.shows?.screen?.name}
              </p>
              <p className="inspect-line">
                <strong>Showtime:</strong> {formatDateIST(selectedBooking.shows?.starts_at)} at {formatTimeIST(selectedBooking.shows?.starts_at)} IST
              </p>
            </div>

            <div className="inspect-section">
              <h4 className="inspect-section-title">Reserved Seats</h4>
              <div className="inspect-seats-list">
                {(selectedBooking.booking_seats || []).map((bs) => (
                  <span key={bs.id} className="inspect-seat-chip">
                    Row {bs.seat?.row_label}{bs.seat?.seat_number} ({bs.seat?.category}) - {formatCurrency(bs.price)}
                  </span>
                ))}
              </div>
            </div>

            <div className="inspect-section">
              <h4 className="inspect-section-title">Payment Summary</h4>
              <div className="inspect-pricing-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedBooking.subtotal)}</span>
              </div>
              {Number(selectedBooking.convenience_fee) > 0 && (
                <div className="inspect-pricing-row">
                  <span>Convenience Fee:</span>
                  <span>{formatCurrency(selectedBooking.convenience_fee)}</span>
                </div>
              )}
              <div className="inspect-pricing-row total">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedBooking.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
