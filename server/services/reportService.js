import { supabaseAdmin } from '../config/supabase.js';

export const reportService = {
  async getReports({ fromDate, toDate }) {
    const from = fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin.rpc('admin_report', {
      p_from: from,
      p_to: to
    });

    if (error) throw error;

    // Calculate aggregated metrics
    const totalRevenue = (data || []).reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
    const totalBookings = (data || []).reduce((sum, row) => sum + parseInt(row.total_bookings || 0, 10), 0);
    const totalSeats = (data || []).reduce((sum, row) => sum + parseInt(row.seats_sold || 0, 10), 0);

    // Group by movie
    const movieBreakdown = {};
    // Group by theatre
    const theatreBreakdown = {};

    (data || []).forEach((row) => {
      // Movie
      if (!movieBreakdown[row.movie_title]) {
        movieBreakdown[row.movie_title] = { bookings: 0, seats: 0, revenue: 0 };
      }
      movieBreakdown[row.movie_title].bookings += parseInt(row.total_bookings, 10);
      movieBreakdown[row.movie_title].seats += parseInt(row.seats_sold, 10);
      movieBreakdown[row.movie_title].revenue += parseFloat(row.total_revenue);

      // Theatre
      if (!theatreBreakdown[row.theatre_name]) {
        theatreBreakdown[row.theatre_name] = { bookings: 0, seats: 0, revenue: 0 };
      }
      theatreBreakdown[row.theatre_name].bookings += parseInt(row.total_bookings, 10);
      theatreBreakdown[row.theatre_name].seats += parseInt(row.seats_sold, 10);
      theatreBreakdown[row.theatre_name].revenue += parseFloat(row.total_revenue);
    });

    return {
      period: { from, to },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        totalSeats
      },
      dailyRecords: data || [],
      movieBreakdown,
      theatreBreakdown
    };
  },

  async exportReportCSV({ fromDate, toDate }) {
    const reportData = await this.getReports({ fromDate, toDate });
    const records = reportData.dailyRecords;

    const headers = ['Date', 'Movie Title', 'Theatre Name', 'Total Bookings', 'Seats Sold', 'Revenue (INR)'];
    const rows = records.map((r) => [
      r.report_date,
      `"${(r.movie_title || '').replace(/"/g, '""')}"`,
      `"${(r.theatre_name || '').replace(/"/g, '""')}"`,
      r.total_bookings,
      r.seats_sold,
      r.total_revenue
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return csvContent;
  }
};
