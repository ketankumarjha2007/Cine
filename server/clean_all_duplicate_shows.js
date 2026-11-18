/**
 * clean_all_duplicate_shows.js (Paginated to handle all shows in DB)
 */

import { supabaseAdmin } from './config/supabase.js';

async function fetchAllShows() {
  const allShows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('shows')
      .select('id, movie_id, screen_id, starts_at, screens(theatre_id)')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allShows.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  return allShows;
}

async function run() {
  console.log('\n=== COMPLETE SHOW DEDUPLICATION ===\n');

  const allShows = await fetchAllShows();
  console.log(`Loaded all ${allShows.length} shows from database.`);

  // Fetch all booked show IDs
  const { data: bookings } = await supabaseAdmin.from('bookings').select('show_id');
  const bookedShowIds = new Set((bookings || []).map((b) => b.show_id));

  // Group by theatre_id + movie_id + starts_at
  const showGroups = {};
  for (const s of allShows) {
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

  // Batch delete in chunks of 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < allIdsToDelete.length; i += CHUNK_SIZE) {
    const chunk = allIdsToDelete.slice(i, i + CHUNK_SIZE);
    await supabaseAdmin.from('booking_seats').delete().in('show_id', chunk);
    await supabaseAdmin.from('shows').delete().in('id', chunk);
  }

  console.log(`Deleted all ${allIdsToDelete.length} duplicate shows.`);

  // Verify
  const verified = await fetchAllShows();
  const verifyGroups = {};
  for (const s of verified) {
    const theatreId = s.screens?.theatre_id;
    if (!theatreId) continue;
    const key = `${theatreId}_${s.movie_id}_${s.starts_at}`;
    verifyGroups[key] = (verifyGroups[key] || 0) + 1;
  }
  const remaining = Object.values(verifyGroups).filter((c) => c > 1).length;
  console.log(`Verified remaining duplicate showtimes across ALL theatres: ${remaining}`);
  console.log('=== COMPLETE ===\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
