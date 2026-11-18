/**
 * clean_duplicate_shows.js (Fast Batched Version)
 */

import { supabaseAdmin } from './config/supabase.js';

async function run() {
  console.log('\n=== FAST CLEANING DUPLICATE SHOWS ===\n');

  // 1. Fetch all shows
  const { data: shows, error } = await supabaseAdmin
    .from('shows')
    .select('id, movie_id, screen_id, starts_at, screens(theatre_id)')
    .order('starts_at', { ascending: true });

  if (error) throw error;
  console.log(`Analyzing ${shows.length} shows...`);

  // 2. Fetch all shows that have bookings
  const { data: bookings } = await supabaseAdmin.from('bookings').select('show_id');
  const bookedShowIds = new Set((bookings || []).map((b) => b.show_id));

  // 3. Group by theatre_id + movie_id + starts_at
  const showGroups = {};
  for (const s of shows) {
    const theatreId = s.screens?.theatre_id;
    if (!theatreId) continue;
    const key = `${theatreId}_${s.movie_id}_${s.starts_at}`;
    if (!showGroups[key]) showGroups[key] = [];
    showGroups[key].push(s);
  }

  const allIdsToDelete = [];

  for (const [key, list] of Object.entries(showGroups)) {
    if (list.length > 1) {
      // Keep the one with booking if any, else keep the first one
      const keepShow = list.find((s) => bookedShowIds.has(s.id)) || list[0];
      const duplicates = list.filter((s) => s.id !== keepShow.id);
      duplicates.forEach((d) => allIdsToDelete.push(d.id));
    }
  }

  console.log(`Found ${allIdsToDelete.length} duplicate shows to delete.`);

  // 4. Batch delete in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < allIdsToDelete.length; i += CHUNK_SIZE) {
    const chunk = allIdsToDelete.slice(i, i + CHUNK_SIZE);
    await supabaseAdmin.from('booking_seats').delete().in('show_id', chunk);
    await supabaseAdmin.from('shows').delete().in('id', chunk);
  }

  console.log(`Deleted ${allIdsToDelete.length} duplicate shows.`);

  // 5. Final check
  const { data: finalShows } = await supabaseAdmin
    .from('shows')
    .select('id, movie_id, starts_at, screens(theatre_id)');

  const finalGroups = {};
  for (const s of finalShows) {
    const theatreId = s.screens?.theatre_id;
    if (!theatreId) continue;
    const key = `${theatreId}_${s.movie_id}_${s.starts_at}`;
    finalGroups[key] = (finalGroups[key] || 0) + 1;
  }

  const remaining = Object.values(finalGroups).filter((c) => c > 1).length;
  console.log(`Remaining duplicate showtimes: ${remaining}`);
  console.log('=== COMPLETE ===\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
