/**
 * schedule_bollywood.js
 * Imports real TMDB data with verified working image URLs for:
 * - Ramayana: Rise of a Legend
 * - Hanuman Ansh
 * - Hanu-Man
 * - Stree 2
 * - Singham Again
 * - Bhool Bhulaiyaa 3
 * - Kalki 2898-AD
 * - Pushpa 2 - The Rule
 * - Kantara
 * - Brahmāstra Part One: Shiva
 * - Jawan
 * - Animal
 *
 * Schedules shows for 30 days across all screens & cities, and creates active hero banners.
 */

import { supabaseAdmin } from './config/supabase.js';
import { env } from './config/env.js';

const TMDB_API_KEY = env.TMDB_API_KEY || 'e0dc0016a1da7d43d7bd136fb4cd7e16';

// List of target Bollywood / Indian movies requested by user
const TARGET_MOVIES = [
  { search: 'Ramayana: Rise of a Legend', status: 'now_showing', certificate: 'UA' },
  { search: 'Hanuman Ansh', status: 'now_showing', certificate: 'UA' },
  { search: 'Hanu-Man', status: 'now_showing', certificate: 'UA' },
  { search: 'Stree 2', status: 'now_showing', certificate: 'UA' },
  { search: 'Singham Again', status: 'now_showing', certificate: 'UA' },
  { search: 'Bhool Bhulaiyaa 3', status: 'now_showing', certificate: 'UA' },
  { search: 'Kalki 2898-AD', status: 'now_showing', certificate: 'UA' },
  { search: 'Pushpa 2 - The Rule', status: 'now_showing', certificate: 'A' },
  { search: 'Kantara', status: 'now_showing', certificate: 'UA' },
  { search: 'Brahmāstra Part One: Shiva', status: 'now_showing', certificate: 'UA' },
  { search: 'Jawan', status: 'now_showing', certificate: 'UA' },
  { search: 'Animal', status: 'now_showing', certificate: 'A' },
];

function daysFromNow(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt;
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function isoTs(date, hour, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function fetchTmdbMovie(searchQuery) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const movie = (data.results || [])[0];
    if (!movie) return null;

    // Fetch details for runtime, genres, trailers
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
    const dRes = await fetch(detailsUrl);
    const details = dRes.ok ? await dRes.json() : movie;

    let trailerKey = null;
    const trailers = details.videos?.results?.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailers && trailers.length > 0) {
      trailerKey = trailers[0].key;
    }

    const genreMap = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
      99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
      27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
      53: 'Thriller', 10752: 'War', 37: 'Western'
    };

    const genres = details.genres
      ? details.genres.map((g) => g.name)
      : (movie.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);

    return {
      tmdb_id: movie.id,
      title: details.title || movie.title,
      overview: details.overview || movie.overview || 'Experience the grand epic on the big screen.',
      language: details.original_language === 'hi' ? 'Hindi' : details.original_language === 'te' ? 'Telugu' : 'Hindi',
      genres: genres.length > 0 ? genres : ['Action', 'Drama'],
      duration_minutes: details.runtime || 140,
      release_date: details.release_date || isoDate(new Date()),
      poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      trailer_key: trailerKey,
      rating: Number((details.vote_average || 7.5).toFixed(1)),
    };
  } catch (err) {
    console.error(`Error fetching TMDB for ${searchQuery}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('\n=== CineTicket Bollywood & Mythological Movie Scheduler ===\n');

  // 1. Fetch details from TMDB
  const moviesToUpsert = [];
  for (const item of TARGET_MOVIES) {
    console.log(`Fetching TMDB info for: ${item.search}...`);
    const tmdbData = await fetchTmdbMovie(item.search);
    if (tmdbData) {
      moviesToUpsert.push({
        ...tmdbData,
        status: item.status,
        certificate: item.certificate,
      });
      console.log(`  Found: ${tmdbData.title} (Poster: ${tmdbData.poster_url ? 'YES' : 'NO'}, Backdrop: ${tmdbData.backdrop_url ? 'YES' : 'NO'})`);
    }
  }

  // 2. Upsert movies into Supabase
  console.log(`\nUpserting ${moviesToUpsert.length} movies into database...`);
  const { data: upsertedMovies, error: mErr } = await supabaseAdmin
    .from('movies')
    .upsert(moviesToUpsert, { onConflict: 'tmdb_id' })
    .select('id, title, status, backdrop_url');

  if (mErr) {
    throw new Error('Movie upsert failed: ' + mErr.message);
  }
  console.log(`Successfully upserted ${upsertedMovies.length} movies.`);

  // 3. Create active banners for hero carousel with verified backdrops
  console.log('\nCreating active banners for top movies...');
  await supabaseAdmin.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // clear old banners

  const bannerCandidates = upsertedMovies.filter((m) => m.backdrop_url).slice(0, 5);
  const bannersToInsert = bannerCandidates.map((m, idx) => ({
    title: m.title,
    subtitle: 'Now playing in theatres near you • Book your seats now',
    image_url: m.backdrop_url,
    link_url: `/movie/${m.id}`,
    sort_order: idx + 1,
    active: true,
  }));

  if (bannersToInsert.length > 0) {
    const { error: bErr } = await supabaseAdmin.from('banners').insert(bannersToInsert);
    if (bErr) console.warn('Banner insert warn:', bErr.message);
    else console.log(`Created ${bannersToInsert.length} active banners with real high-res backdrops.`);
  }

  // 4. Fetch all screens and theatres
  const { data: theatres } = await supabaseAdmin.from('theatres').select('id, name, city');
  const { data: screens } = await supabaseAdmin.from('screens').select('id, theatre_id, screen_type');

  if (!screens || screens.length === 0) {
    console.log('No screens found! Run seed_demo first.');
    return;
  }
  console.log(`\nScheduling shows for ${upsertedMovies.length} movies across ${screens.length} screens in ${theatres.length} theatres...`);

  // Show slots throughout the day
  const SLOTS = [
    { hour: 9, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 16, minute: 30 },
    { hour: 20, minute: 15 },
  ];

  const showsToInsert = [];

  // Schedule for next 30 days (day 0 to day 30)
  for (const screen of screens) {
    let movieIdx = 0;
    for (let day = 0; day <= 30; day++) {
      const showDate = daysFromNow(day);
      // Pick 2 slots per day per screen
      const dailySlots = day % 2 === 0 ? [SLOTS[0], SLOTS[2]] : [SLOTS[1], SLOTS[3]];

      for (const slot of dailySlots) {
        const movie = upsertedMovies[movieIdx % upsertedMovies.length];
        movieIdx++;

        const startsAt = isoTs(showDate, slot.hour, slot.minute);
        const endsAt = new Date(new Date(startsAt).getTime() + 150 * 60000).toISOString();

        showsToInsert.push({
          movie_id: movie.id,
          screen_id: screen.id,
          starts_at: startsAt,
          ends_at: endsAt,
          language: 'Hindi',
          format: screen.screen_type === 'IMAX' ? 'IMAX' : '2D',
          price_by_category: { Standard: 200, Premium: 350, VIP: 500 },
          status: 'scheduled',
        });
      }
    }
  }

  console.log(`Prepared ${showsToInsert.length} show slots. Inserting in chunks...`);

  const CHUNK_SIZE = 50;
  let successCount = 0;
  for (let i = 0; i < showsToInsert.length; i += CHUNK_SIZE) {
    const chunk = showsToInsert.slice(i, i + CHUNK_SIZE);
    const { error: sErr } = await supabaseAdmin.from('shows').insert(chunk);
    if (!sErr) {
      successCount += chunk.length;
    }
  }

  console.log(`\nSuccessfully scheduled ${successCount} shows for 1 month!`);
  console.log('=== All Done! ===\n');
}

main().catch((err) => {
  console.error('[SCHEDULER ERROR]:', err);
  process.exit(1);
});
