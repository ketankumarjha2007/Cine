import React, { useState, useEffect } from 'react';
import { IndianRupee, Ticket, Armchair, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import { formatCurrency } from '../../utils/format.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      setData(res.data);
    } catch (err) {
      console.error('[ADMIN DASHBOARD ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const records = data?.dailyRecords || [];
  // Build last 7 days chart data
  const chartPoints = records.slice(0, 7).reverse();
  const maxRevenue = Math.max(...chartPoints.map((p) => parseFloat(p.total_revenue || 0)), 1000);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview of cinema performance, daily revenues, and ticket reservations"
      actions={
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchStats} loading={loading}>
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="dashboard-loading-box">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="dashboard-stats-grid">
            <StatCard
              title="Total Revenue (30d)"
              value={formatCurrency(data?.summary?.totalRevenue || 0)}
              icon={IndianRupee}
              variant="primary"
            />
            <StatCard
              title="Confirmed Bookings"
              value={data?.summary?.totalBookings || 0}
              icon={Ticket}
            />
            <StatCard
              title="Seats Reserved"
              value={data?.summary?.totalSeats || 0}
              icon={Armchair}
              variant="success"
            />
          </div>

          {/* Revenue SVG Trend Chart */}
          <div className="dashboard-chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Revenue Trend (Recent Active Days)</h3>
              <span className="chart-subtitle">Direct box office revenue from confirmed bookings</span>
            </div>

            {chartPoints.length > 0 ? (
              <div className="svg-chart-container">
                <svg viewBox="0 0 600 200" className="revenue-svg-chart" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#2A2A38" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#2A2A38" strokeDasharray="4 4" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#2A2A38" strokeDasharray="4 4" />

                  {/* Polyline Graph */}
                  {chartPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="3"
                      points={chartPoints
                        .map((pt, idx) => {
                          const x = (idx / (chartPoints.length - 1)) * 560 + 20;
                          const rev = parseFloat(pt.total_revenue || 0);
                          const y = 180 - (rev / maxRevenue) * 140;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Data Points */}
                  {chartPoints.map((pt, idx) => {
                    const x = chartPoints.length === 1 ? 300 : (idx / (chartPoints.length - 1)) * 560 + 20;
                    const rev = parseFloat(pt.total_revenue || 0);
                    const y = 180 - (rev / maxRevenue) * 140;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="#E11D48" stroke="#0B0B10" strokeWidth="2" />
                        <text x={x} y="195" textAnchor="middle" fill="#A5A5B5" fontSize="10">
                          {pt.report_date?.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p className="no-chart-data-notice">No completed booking revenue in the recorded period.</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
