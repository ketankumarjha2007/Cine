import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../config/supabase.js';
import { tmdbService } from '../services/tmdbService.js';
import { reportService } from '../services/reportService.js';
import { bookingService } from '../services/bookingService.js';

const router = Router();

// Apply auth + requireAdmin to all admin routes
router.use(authenticateUser, requireAdmin);

// ============================================================================
// 1. MOVIES MANAGEMENT
// ============================================================================

// GET /api/admin/movies
router.get('/movies', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = supabaseAdmin
      .from('movies')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const from = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const to = from + parseInt(limit, 10) - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.status(200).json({ movies: data, total: count });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/movies/import
router.post('/movies/import', async (req, res, next) => {
  try {
    const nowPlaying = await tmdbService.getNowPlayingMovies(1);
    const upcoming = await tmdbService.getUpcomingMovies(1);

    const imported = [];
    const moviesToProcess = [
      ...(nowPlaying.results || []).map((m) => ({ ...m, defaultStatus: 'now_showing' })),
      ...(upcoming.results || []).map((m) => ({ ...m, defaultStatus: 'upcoming' }))
    ];

    // Deduplicate by TMDB ID
    const uniqueMap = new Map();
    for (const m of moviesToProcess) {
      if (!uniqueMap.has(m.id)) {
        uniqueMap.set(m.id, m);
      }
    }

    for (const movieItem of uniqueMap.values()) {
      try {
        const details = await tmdbService.getMovieDetails(movieItem.id);

        const movieRecord = {
          tmdb_id: details.tmdb_id,
          title: details.title,
          overview: details.overview,
          language: details.language,
          genres: details.genres,
          duration_minutes: details.duration_minutes,
          release_date: details.release_date || null,
          certificate: details.certificate,
          poster_url: details.poster_url,
          backdrop_url: details.backdrop_url,
          trailer_key: details.trailer_key,
          rating: details.rating,
          status: movieItem.defaultStatus
        };

        const { data, error } = await supabaseAdmin
          .from('movies')
          .upsert(movieRecord, { onConflict: 'tmdb_id' })
          .select()
          .single();

        if (!error && data) {
          imported.push(data);
        }
      } catch (err) {
        console.warn(`[TMDB IMPORT SKIP] Failed importing movie ${movieItem.id}:`, err.message);
      }
    }

    res.status(200).json({
      message: `Successfully imported ${imported.length} movies from TMDB`,
      count: imported.length,
      movies: imported
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/movies
router.post('/movies', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/movies/:id
router.put('/movies/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 2. THEATRES MANAGEMENT
// ============================================================================

// GET /api/admin/theatres
router.get('/theatres', async (req, res, next) => {
  try {
    const { city, search } = req.query;
    let query = supabaseAdmin
      .from('theatres')
      .select(`
        *,
        screens (id, name, screen_type, total_seats)
      `);

    if (city) query = query.eq('city', city);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Format coordinates from geography if needed
    const theatresWithCoords = (data || []).map((t) => {
      let lat = null;
      let lng = null;
      if (t.location) {
        // PostGIS point string or object
        if (typeof t.location === 'string') {
          const match = t.location.match(/POINT\(([^ ]+) ([^ ]+)\)/i);
          if (match) {
            lng = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        }
      }
      return { ...t, latitude: lat, longitude: lng };
    });

    res.status(200).json({ theatres: theatresWithCoords });
  } catch (error) {
    next(error);
  }
});

// Optional Geocoding helper using OpenStreetMap Nominatim
router.get('/theatres/geocode', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Query string q is required' } });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`, {
      headers: {
        'User-Agent': 'CineTicket-App/1.0 (admin-theatre-setup)'
      }
    });

    if (!response.ok) {
      throw new Error('Nominatim geocode request failed');
    }

    const data = await response.json();
    res.status(200).json({ results: data });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/theatres
router.post('/theatres', async (req, res, next) => {
  try {
    const { name, address, city, state, pincode, latitude, longitude, image_url, amenities } = req.body;

    const pointWkt = `SRID=4326;POINT(${longitude} ${latitude})`;

    const { data, error } = await supabaseAdmin
      .from('theatres')
      .insert({
        name,
        address,
        city,
        state,
        pincode,
        location: pointWkt,
        image_url,
        amenities: amenities || []
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/theatres/:id
router.put('/theatres/:id', async (req, res, next) => {
  try {
    const { name, address, city, state, pincode, latitude, longitude, image_url, amenities } = req.body;
    const updates = { name, address, city, state, pincode, image_url, amenities };

    if (latitude !== undefined && longitude !== undefined) {
      updates.location = `SRID=4326;POINT(${longitude} ${latitude})`;
    }

    const { data, error } = await supabaseAdmin
      .from('theatres')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/theatres/:id
router.delete('/theatres/:id', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('theatres')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 3. SCREENS & SEAT LAYOUT GENERATOR
// ============================================================================

// POST /api/admin/screens
router.post('/screens', async (req, res, next) => {
  try {
    const { theatre_id, name, screen_type, layout } = req.body;
    // layout format:
    // [
    //   { row: 'A', seats: 12, category: 'VIP' },
    //   { row: 'B', seats: 14, category: 'Premium' },
    //   { row: 'C', seats: 14, category: 'Standard' }
    // ]

    let totalSeats = 0;
    if (Array.isArray(layout)) {
      totalSeats = layout.reduce((sum, r) => sum + (parseInt(r.seats, 10) || 0), 0);
    }

    // Insert screen
    const { data: screen, error: screenErr } = await supabaseAdmin
      .from('screens')
      .insert({
        theatre_id,
        name,
        screen_type: screen_type || '2D',
        total_seats: totalSeats
      })
      .select()
      .single();

    if (screenErr) throw screenErr;

    // Generate seats rows
    if (Array.isArray(layout) && layout.length > 0) {
      const seatRecords = [];
      for (const rowConfig of layout) {
        const rowLabel = rowConfig.row.trim().toUpperCase();
        const seatCount = parseInt(rowConfig.seats, 10);
        const category = rowConfig.category || 'Standard';

        for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
          seatRecords.push({
            screen_id: screen.id,
            row_label: rowLabel,
            seat_number: seatNum,
            category
          });
        }
      }

      if (seatRecords.length > 0) {
        const { error: seatErr } = await supabaseAdmin
          .from('seats')
          .insert(seatRecords);

        if (seatErr) throw seatErr;
      }
    }

    res.status(201).json(screen);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/screens/:id
router.delete('/screens/:id', async (req, res, next) => {
  try {
    // Prevent deletion if screen has future shows
    const { data: futureShows } = await supabaseAdmin
      .from('shows')
      .select('id')
      .eq('screen_id', req.params.id)
      .gte('ends_at', new Date().toISOString())
      .limit(1);

    if (futureShows && futureShows.length > 0) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_ACTIVE_SCREEN',
          message: 'Cannot delete screen with scheduled future shows.'
        }
      });
    }

    const { error } = await supabaseAdmin
      .from('screens')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 4. SHOWS MANAGEMENT
// ============================================================================

// GET /api/admin/shows
router.get('/shows', async (req, res, next) => {
  try {
    const { movie_id, theatre_id, date } = req.query;
    let query = supabaseAdmin
      .from('shows')
      .select(`
        *,
        movie:movie_id (id, title, poster_url),
        screen:screen_id (id, name, theatre:theatre_id (id, name, city))
      `);

    if (movie_id) query = query.eq('movie_id', movie_id);
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte('starts_at', startOfDay).lte('starts_at', endOfDay);
    }

    const { data, error } = await query.order('starts_at', { ascending: true });
    if (error) throw error;

    res.status(200).json({ shows: data });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/shows
router.post('/shows', async (req, res, next) => {
  try {
    const { movie_id, screen_id, starts_at, ends_at, language, format, price_by_category } = req.body;

    const { data, error } = await supabaseAdmin
      .from('shows')
      .insert({
        movie_id,
        screen_id,
        starts_at,
        ends_at,
        language: language || 'English',
        format: format || '2D',
        price_by_category: price_by_category || { Standard: 200, Premium: 350, VIP: 500 },
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      // Check exclusion constraint violation
      if (error.code === '23P01' || error.message?.includes('no_screen_show_overlap')) {
        return res.status(409).json({
          error: {
            code: 'SHOW_TIME_OVERLAP',
            message: 'Screen is already booked for another show during the selected time interval.'
          }
        });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/shows/:id
router.put('/shows/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('shows')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23P01' || error.message?.includes('no_screen_show_overlap')) {
        return res.status(409).json({
          error: {
            code: 'SHOW_TIME_OVERLAP',
            message: 'Screen is already booked for another show during the updated time interval.'
          }
        });
      }
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 5. BANNERS MANAGEMENT
// ============================================================================

router.get('/banners', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.status(200).json({ banners: data });
  } catch (error) {
    next(error);
  }
});

router.post('/banners', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/banners/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/banners/:id', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 6. BOOKINGS INSPECTION & REPORTS
// ============================================================================

router.get('/bookings', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        shows (
          starts_at,
          movie:movie_id (title),
          screen:screen_id (name, theatre:theatre_id (name, city))
        ),
        payments (razorpay_payment_id, status)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('booking_code', `%${search}%`);

    const from = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const to = from + parseInt(limit, 10) - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.status(200).json({ bookings: data, total: count });
  } catch (error) {
    next(error);
  }
});

router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingDetails({
      bookingId: req.params.id,
      isAdmin: true
    });
    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const report = await reportService.getReports({ fromDate: from, toDate: to });
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/export', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const csvData = await reportService.exportReportCSV({ fromDate: from, toDate: to });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cineticket-report-${Date.now()}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
});

export default router;
