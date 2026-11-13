import { supabaseAdmin } from '../config/supabase.js';
import { tmdbService } from '../services/tmdbService.js';

async function importNowPlaying() {
  console.log('[SCRIPT] Starting import of Now Playing movies from TMDB (Region: IN)...');
  try {
    const data = await tmdbService.getNowPlayingMovies(1);
    const movies = data.results || [];
    console.log(`[SCRIPT] Fetched ${movies.length} movies from TMDB.`);

    for (const m of movies) {
      try {
        const details = await tmdbService.getMovieDetails(m.id);
        const { error } = await supabaseAdmin.from('movies').upsert({
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
          status: 'now_showing'
        }, { onConflict: 'tmdb_id' });

        if (error) {
          console.error(`[SCRIPT ERROR] Failed to upsert ${details.title}:`, error.message);
        } else {
          console.log(`[SCRIPT SUCCESS] Imported: ${details.title}`);
        }
      } catch (err) {
        console.warn(`[SCRIPT WARN] Skipping movie ${m.id}:`, err.message);
      }
    }
    console.log('[SCRIPT] Import completed.');
  } catch (err) {
    console.error('[SCRIPT FATAL]', err);
    process.exit(1);
  }
}

importNowPlaying();
