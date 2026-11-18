/**
 * fix_movies_no_shows.mjs
 * Find now_showing movies with 0 future scheduled shows and either
 * add them to the schedule OR change their status to 'upcoming'
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const NOW = new Date().toISOString();
const THIRTY_DAYS = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

async function main() {
  console.log('🔍 Finding now_showing movies with 0 future shows...\n');

  // Get all now_showing movies
  const { data: movies, error: movErr } = await supabase
    .from('movies')
    .select('id, title, duration_minutes, status, release_date')
    .eq('status', 'now_showing')
    .order('title');

  if (movErr) { console.error(movErr); return; }
  console.log(`Total now_showing movies: ${movies.length}\n`);

  // Get show counts per movie
  const { data: showCounts, error: scErr } = await supabase
    .from('shows')
    .select('movie_id')
    .eq('status', 'scheduled')
    .gte('starts_at', NOW)
    .lte('starts_at', THIRTY_DAYS);

  if (scErr) { console.error(scErr); return; }

  const movieShowCounts = {};
  for (const s of showCounts || []) {
    movieShowCounts[s.movie_id] = (movieShowCounts[s.movie_id] || 0) + 1;
  }

  const noShows = movies.filter(m => !movieShowCounts[m.id] || movieShowCounts[m.id] === 0);
  const hasShows = movies.filter(m => movieShowCounts[m.id] && movieShowCounts[m.id] > 0);

  console.log(`✅ Movies with future shows: ${hasShows.length}`);
  console.log(`❌ Movies with NO future shows: ${noShows.length}\n`);

  if (noShows.length > 0) {
    console.log('Movies with no future shows:');
    for (const m of noShows) {
      console.log(`  - "${m.title}" (id: ${m.id}, release: ${m.release_date})`);
    }

    // These movies have no shows - change them to 'upcoming' so they 
    // don't appear in "Now Showing" with no bookable shows
    console.log('\n⚡ Moving these to "upcoming" status to prevent empty show listings...');
    
    const noShowIds = noShows.map(m => m.id);
    const { error: updateErr } = await supabase
      .from('movies')
      .update({ status: 'upcoming' })
      .in('id', noShowIds);

    if (updateErr) {
      console.error('Update error:', updateErr.message);
    } else {
      console.log(`✅ Updated ${noShows.length} movies to "upcoming" status`);
      console.log('   (They will appear in Coming Soon section instead)');
    }
  }

  // Final verification
  const { data: finalCheck } = await supabase
    .from('movies')
    .select('status')
    .in('status', ['now_showing', 'upcoming']);

  const statusCounts = {};
  for (const m of finalCheck || []) {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
  }

  console.log('\n📊 Final movie status distribution:');
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`   ${status}: ${count} movies`);
  }

  // Show distribution per city
  console.log('\n🏙️  Show distribution by city:');
  const { data: theatres } = await supabase
    .from('theatres')
    .select('id, name, city');
  
  const { data: allShows } = await supabase
    .from('shows')
    .select('screen_id, screens!inner(theatre_id, theatres!inner(city))')
    .eq('status', 'scheduled')
    .gte('starts_at', NOW);

  const cityCounts = {};
  for (const s of allShows || []) {
    const city = s.screens?.theatres?.city || 'Unknown';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  }
  for (const [city, count] of Object.entries(cityCounts)) {
    console.log(`   ${city}: ${count} shows`);
  }
}

main().catch(console.error);
