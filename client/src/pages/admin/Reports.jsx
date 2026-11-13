import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import api from '../../services/api.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatCurrency } from '../../utils/format.js';
import './Reports.css';

export default function AdminReports() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports', { params: { from, to } });
      setData(res.data);
    } catch (err) {
      console.error('[FETCH REPORTS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/reports/export', {
        params: { from, to },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cineticket-report-${from}-to-${to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const records = data?.dailyRecords || [];
  const movieBreakdown = data?.movieBreakdown || {};
  const theatreBreakdown = data?.theatreBreakdown || {};

  return (
    <AdminLayout
      title="Financial & Sales Reports"
      subtitle="Analyze ticket sales, revenue generation by movie and theatre, and export CSV data"
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          onClick={handleExportCSV}
          loading={exporting}
          disabled={records.length === 0}
        >
          Export CSV Report
        </Button>
      }
    >
      {/* Date Range Filter Bar */}
      <div className="report-filter-card">
        <div className="report-dates-row">
          <div className="filter-date-group">
            <label className="filter-label">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="report-date-input"
            />
          </div>

          <div className="filter-date-group">
            <label className="filter-label">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="report-date-input"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Filter}
            onClick={fetchReports}
            loading={loading}
          >
            Apply Range
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="report-loading-container">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="dashboard-stats-grid">
            <StatCard
              title="Aggregated Revenue"
              value={formatCurrency(data?.summary?.totalRevenue || 0)}
              variant="primary"
            />
            <StatCard
              title="Bookings Completed"
              value={data?.summary?.totalBookings || 0}
            />
            <StatCard
              title="Total Seats Occupied"
              value={data?.summary?.totalSeats || 0}
              variant="success"
            />
          </div>

          {/* Breakdown Tables Grid */}
          <div className="report-breakdowns-grid">
            {/* By Movie */}
            <div className="breakdown-card">
              <h3 className="breakdown-title">Revenue by Movie</h3>
              <div className="breakdown-table-wrapper">
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Movie Title</th>
                      <th>Bookings</th>
                      <th>Seats</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(movieBreakdown).length === 0 ? (
                      <tr><td colSpan="4" className="empty-table-cell">No sales recorded</td></tr>
                    ) : (
                      Object.entries(movieBreakdown).map(([mTitle, stats]) => (
                        <tr key={mTitle}>
                          <td><strong>{mTitle}</strong></td>
                          <td>{stats.bookings}</td>
                          <td>{stats.seats}</td>
                          <td className="text-right">{formatCurrency(stats.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Theatre */}
            <div className="breakdown-card">
              <h3 className="breakdown-title">Revenue by Cinema Theatre</h3>
              <div className="breakdown-table-wrapper">
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Cinema Name</th>
                      <th>Bookings</th>
                      <th>Seats</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(theatreBreakdown).length === 0 ? (
                      <tr><td colSpan="4" className="empty-table-cell">No sales recorded</td></tr>
                    ) : (
                      Object.entries(theatreBreakdown).map(([tName, stats]) => (
                        <tr key={tName}>
                          <td><strong>{tName}</strong></td>
                          <td>{stats.bookings}</td>
                          <td>{stats.seats}</td>
                          <td className="text-right">{formatCurrency(stats.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
