import { supabaseAdmin } from '../config/supabase.js';

export const reportService = {
  async getReports({ fromDate, toDate }) {
    const from = fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];

    const nowIso = new Date().toISOString();

    // Fetch live system counts and real confirmed bookings with related details
    const [
      moviesCountRes,
      theatresCountRes,
      upcomingShowsCountRes,
      cancelledBookingsRes,
      confirmedBookingsRes
    ] = await Promise.all([
      supabaseAdmin.from('movies').select('id', { count: 'exact', head: true }).in('status', ['now_showing', 'upcoming']),
      supabaseAdmin.from('theatres').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('shows').select('id', { count: 'exact', head: true }).gte('starts_at', nowIso).eq('status', 'scheduled'),
      supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'CANCELLED'),
      supabaseAdmin
        .from('bookings')
        .select(`
          id,
          total_amount,
          created_at,
          confirmed_at,
          show:show_id (
            id,
            movie:movie_id (title),
            screen:screen_id (
              id,
              theatre:theatre_id (name)
            )
          ),
          booking_seats (id, status)
        `)
        .eq('status', 'CONFIRMED')
    ]);

    const bookings = confirmedBookingsRes.data || [];

    // Filter bookings by date range if provided
    const filteredBookings = bookings.filter((b) => {
      const dateStr = (b.confirmed_at || b.created_at || '').split('T')[0];
      if (!dateStr) return true;
      return dateStr >= from && dateStr <= to;
    });

    // Aggregations
    let totalRevenue = 0;
    let totalSeats = 0;
    const movieBreakdown = {};
    const theatreBreakdown = {};
    const dailyMap = {};

    filteredBookings.forEach((b) => {
      const amount = Number(b.total_amount) || 0;
      const bookedSeatsCount = (b.booking_seats || []).filter(
        (s) => s.status === 'BOOKED'
      ).length || (b.booking_seats || []).length || 1;

      totalRevenue += amount;
      totalSeats += bookedSeatsCount;

      const movieTitle = b.show?.movie?.title || 'Unknown Movie';
      const theatreName = b.show?.screen?.theatre?.name || 'Unknown Cinema';
      const reportDate = (b.confirmed_at || b.created_at || '').split('T')[0] || from;

      // Movie Breakdown
      if (!movieBreakdown[movieTitle]) {
        movieBreakdown[movieTitle] = { bookings: 0, seats: 0, revenue: 0 };
      }
      movieBreakdown[movieTitle].bookings += 1;
      movieBreakdown[movieTitle].seats += bookedSeatsCount;
      movieBreakdown[movieTitle].revenue = Math.round((movieBreakdown[movieTitle].revenue + amount) * 100) / 100;

      // Theatre Breakdown
      if (!theatreBreakdown[theatreName]) {
        theatreBreakdown[theatreName] = { bookings: 0, seats: 0, revenue: 0 };
      }
      theatreBreakdown[theatreName].bookings += 1;
      theatreBreakdown[theatreName].seats += bookedSeatsCount;
      theatreBreakdown[theatreName].revenue = Math.round((theatreBreakdown[theatreName].revenue + amount) * 100) / 100;

      // Daily records
      const dailyKey = `${reportDate}_${movieTitle}_${theatreName}`;
      if (!dailyMap[dailyKey]) {
        dailyMap[dailyKey] = {
          report_date: reportDate,
          movie_title: movieTitle,
          theatre_name: theatreName,
          total_bookings: 0,
          seats_sold: 0,
          total_revenue: 0
        };
      }
      dailyMap[dailyKey].total_bookings += 1;
      dailyMap[dailyKey].seats_sold += bookedSeatsCount;
      dailyMap[dailyKey].total_revenue = Math.round((dailyMap[dailyKey].total_revenue + amount) * 100) / 100;
    });

    const dailyRecords = Object.values(dailyMap).sort((a, b) => b.report_date.localeCompare(a.report_date));

    return {
      period: { from, to },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings: filteredBookings.length,
        totalSeats,
        totalMovies: moviesCountRes.count || 0,
        activeTheatres: theatresCountRes.count || 0,
        upcomingShows: upcomingShowsCountRes.count || 0,
        cancelledBookings: cancelledBookingsRes.count || 0,
      },
      dailyRecords,
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
