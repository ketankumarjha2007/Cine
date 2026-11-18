import { supabaseAdmin } from '../config/supabase.js';

async function verifyAll() {
  console.log('\n--- VERIFYING COMPLETE SCHEDULE QUALITY ---\n');

  let allShows = [];
  let page = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from('shows')
      .select('id, movie_id, screen_id, starts_at, ends_at, price_by_category, screens(theatre_id)')
      .gte('starts_at', '2026-11-18T00:00:00.000Z')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allShows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Loaded ${allShows.length} shows for verification.`);

  // 1. Check exact duplicate start times per theatre per movie
  const theatreMovieTime = {};
  let duplicates = 0;
  for (const s of allShows) {
    const key = `${s.screens?.theatre_id}_${s.movie_id}_${s.starts_at}`;
    if (theatreMovieTime[key]) {
      duplicates++;
    } else {
      theatreMovieTime[key] = true;
    }
  }
  console.log(`Duplicate (theatre + movie + time) shows: ${duplicates} (Target: 0)`);

  // 2. Check screen overlaps
  const screenShows = {};
  for (const s of allShows) {
    if (!screenShows[s.screen_id]) screenShows[s.screen_id] = [];
    screenShows[s.screen_id].push(s);
  }

  let screenOverlaps = 0;
  for (const [screenId, shows] of Object.entries(screenShows)) {
    shows.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    for (let i = 0; i < shows.length - 1; i++) {
      const curEnd = new Date(shows[i].ends_at).getTime();
      const nextStart = new Date(shows[i + 1].starts_at).getTime();
      if (curEnd > nextStart) {
        screenOverlaps++;
      }
    }
  }
  console.log(`Screen overlaps on same screen: ${screenOverlaps} (Target: 0)`);

  // 3. Check min price across all shows
  let zeroPrices = 0;
  let minObservedPrice = Infinity;
  let maxObservedPrice = -Infinity;
  for (const s of allShows) {
    const p = s.price_by_category;
    if (!p || typeof p !== 'object') {
      zeroPrices++;
      continue;
    }
    const vals = Object.values(p).map(Number);
    for (const v of vals) {
      if (isNaN(v) || v <= 0) zeroPrices++;
      if (v < minObservedPrice) minObservedPrice = v;
      if (v > maxObservedPrice) maxObservedPrice = v;
    }
  }

  console.log(`Shows with zero / invalid prices: ${zeroPrices} (Target: 0)`);
  console.log(`Min observed price: ₹${minObservedPrice}`);
  console.log(`Max observed price: ₹${maxObservedPrice}`);
  console.log('\n--- VERIFICATION FINISHED ---\n');
}

verifyAll().catch(console.error);
