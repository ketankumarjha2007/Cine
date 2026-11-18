import { supabaseAdmin } from '../config/supabase.js';

// Base IST offsets for UTC conversion
// IST is UTC+05:30
function istToIsoString(year, month, day, hour, minute) {
  // Construct UTC timestamp from IST
  // hour, minute in IST
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  // Subtract 5 hours 30 mins to get UTC
  dt.setUTCMinutes(dt.getUTCMinutes() - 330);
  return dt.toISOString();
}

async function run() {
  console.log('=====================================================');
  console.log('   CineTicket Professional 30-Day Movie Scheduler   ');
  console.log('=====================================================\n');

  // 1. First, normalize prices of any past / existing booked shows
  console.log('Step 1: Normalizing all past shows with valid pricing...');
  const { data: pastShows } = await supabaseAdmin
    .from('shows')
    .select('id, price_by_category')
    .lt('starts_at', '2026-11-18T00:00:00.000Z');

  if (pastShows && pastShows.length > 0) {
    const defaultPricing = { Standard: 220, Premium: 350, VIP: 500, Recliner: 550 };
    for (const ps of pastShows) {
      let p = ps.price_by_category;
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch {}
      }
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch {}
      }
      if (!p || typeof p !== 'object') {
        p = defaultPricing;
      } else {
        p = {
          Standard: Number(p.Standard || p.standard || 220) || 220,
          Premium: Number(p.Premium || p.premium || 350) || 350,
          VIP: Number(p.VIP || p.vip || 500) || 500,
          Recliner: Number(p.Recliner || p.recliner || 550) || 550,
        };
      }
      await supabaseAdmin
        .from('shows')
        .update({ price_by_category: p })
        .eq('id', ps.id);
    }
    console.log(`  Normalized ${pastShows.length} historical shows.`);
  }

  // 2. Fetch all verified now-showing movies
  console.log('\nStep 2: Loading active now-showing movies...');
  const TARGET_TITLES = [
    'Pushpa 2 - The Rule',
    'Stree 2',
    'Singham Again',
    'Bhool Bhulaiyaa 3',
    'Kalki 2898 AD',
    'Jawan',
    'Animal',
    'Kantara',
    'Hanu-Man',
    'Hanuman Ansh',
    'Ramayana: Rise of a Legend',
    'Brahmāstra Part One: Shiva',
    'Alien: Romulus',
    'Bad Boys: Ride or Die',
    'Godzilla x Kong: The New Empire',
    'Venom: The Last Dance',
    'A Quiet Place: Day One'
  ];

  const { data: movies, error: mErr } = await supabaseAdmin
    .from('movies')
    .select('id, title, duration_minutes, language, status, certificate, poster_url, backdrop_url')
    .in('title', TARGET_TITLES);

  if (mErr || !movies || movies.length === 0) {
    throw new Error('Could not load target movies: ' + (mErr?.message || 'none found'));
  }
  console.log(`  Loaded ${movies.length} blockbuster movies for scheduling.`);

  // Ensure their status is 'now_showing'
  await supabaseAdmin
    .from('movies')
    .update({ status: 'now_showing' })
    .in('id', movies.map(m => m.id));

  // 3. Load all theatres and screens
  console.log('\nStep 3: Loading theatres and screens across all cities...');
  const { data: theatres, error: tErr } = await supabaseAdmin
    .from('theatres')
    .select('id, name, city')
    .order('city');

  if (tErr) throw tErr;

  const { data: screens, error: scErr } = await supabaseAdmin
    .from('screens')
    .select('id, theatre_id, name, screen_type')
    .order('theatre_id');

  if (scErr) throw scErr;

  console.log(`  Loaded ${theatres.length} theatres and ${screens.length} screens.`);

  // Group screens by theatre
  const theatreScreensMap = {};
  for (const t of theatres) {
    theatreScreensMap[t.id] = screens.filter(s => s.theatre_id === t.id);
  }

  // 4. Delete existing unbooked future shows from 2026-11-18 onwards to prevent duplicate timing
  console.log('\nStep 4: Cleaning unbooked future shows to ensure clean schedule...');
  const { data: futureBookings } = await supabaseAdmin
    .from('bookings')
    .select('show_id, shows!inner(starts_at)')
    .gte('shows.starts_at', '2026-11-18T00:00:00.000Z');

  const bookedFutureIds = new Set((futureBookings || []).map(b => b.show_id));

  let futureShowsToDelete = [];
  let page = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from('shows')
      .select('id')
      .gte('starts_at', '2026-11-18T00:00:00.000Z')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    const unbooked = data.filter(s => !bookedFutureIds.has(s.id));
    futureShowsToDelete.push(...unbooked);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`  Deleting ${futureShowsToDelete.length} obsolete future shows in chunks...`);
  const DEL_CHUNK = 200;
  for (let i = 0; i < futureShowsToDelete.length; i += DEL_CHUNK) {
    const ids = futureShowsToDelete.slice(i, i + DEL_CHUNK).map(s => s.id);
    await supabaseAdmin.from('booking_seats').delete().in('show_id', ids);
    await supabaseAdmin.from('shows').delete().in('id', ids);
  }
  console.log('  Cleaned obsolete future shows.');

  // 5. Generate Professional 30-Day Rolling Schedule
  console.log('\nStep 5: Generating professional rolling 30-day schedule...');

  // Start Date: 2026-11-18 (Current local date)
  // End Date: 2026-12-18 (30 days)
  const START_DATE = new Date(2026, 10, 18); // Nov 18, 2026

  // Staggered screen schedule templates (IST times)
  // 4 shows per screen per day
  const SCREEN_SLOT_TEMPLATES = [
    // Screen 0
    [
      { hour: 9, minute: 30 },
      { hour: 13, minute: 15 },
      { hour: 17, minute: 0 },
      { hour: 20, minute: 45 }
    ],
    // Screen 1
    [
      { hour: 10, minute: 0 },
      { hour: 13, minute: 45 },
      { hour: 17, minute: 30 },
      { hour: 21, minute: 15 }
    ],
    // Screen 2
    [
      { hour: 10, minute: 30 },
      { hour: 14, minute: 15 },
      { hour: 18, minute: 0 },
      { hour: 21, minute: 45 }
    ],
    // Screen 3 (IMAX / Large)
    [
      { hour: 11, minute: 0 },
      { hour: 14, minute: 45 },
      { hour: 18, minute: 30 },
      { hour: 22, minute: 15 }
    ],
    // Screen 4 (Additional screen if theatre has 5 screens)
    [
      { hour: 10, minute: 15 },
      { hour: 14, minute: 0 },
      { hour: 17, minute: 45 },
      { hour: 21, minute: 30 }
    ]
  ];

  const showsToInsert = [];

  // Track each screen's shows to verify no overlap
  const screenSchedules = {};

  // For each day (0 to 30)
  for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
    const curDate = new Date(START_DATE);
    curDate.setDate(START_DATE.getDate() + dayOffset);

    const year = curDate.getFullYear();
    const month = curDate.getMonth() + 1;
    const day = curDate.getDate();
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

    let globalMovieIdx = dayOffset * 3;

    for (const theatre of theatres) {
      const thScreens = theatreScreensMap[theatre.id] || [];
      if (thScreens.length === 0) continue;

      let screenIdx = 0;
      for (const screen of thScreens) {
        const slots = SCREEN_SLOT_TEMPLATES[screenIdx % SCREEN_SLOT_TEMPLATES.length];
        const isImax = (screen.screen_type || '').toUpperCase().includes('IMAX');

        // Professional tier pricing
        const pricing = isImax
          ? {
              Standard: isWeekend ? 380 : 350,
              Premium: isWeekend ? 550 : 500,
              VIP: isWeekend ? 700 : 650,
              Recliner: isWeekend ? 800 : 750,
            }
          : {
              Standard: isWeekend ? 250 : 220,
              Premium: isWeekend ? 380 : 350,
              VIP: isWeekend ? 550 : 500,
              Recliner: isWeekend ? 600 : 550,
            };

        for (const slot of slots) {
          const movie = movies[globalMovieIdx % movies.length];
          globalMovieIdx++;

          const startsAt = istToIsoString(year, month, day, slot.hour, slot.minute);
          
          // Realistic end time: duration + 20 minutes (intermission & exit)
          const duration = movie.duration_minutes || 135;
          const endsAt = new Date(new Date(startsAt).getTime() + (duration + 20) * 60000).toISOString();

          // Check screen conflict
          if (!screenSchedules[screen.id]) screenSchedules[screen.id] = [];
          const existing = screenSchedules[screen.id];

          let hasOverlap = false;
          const startMs = new Date(startsAt).getTime();
          const endMs = new Date(endsAt).getTime();

          for (const ex of existing) {
            const exStart = new Date(ex.starts_at).getTime();
            const exEnd = new Date(ex.ends_at).getTime();
            if (startMs < exEnd && endMs > exStart) {
              hasOverlap = true;
              break;
            }
          }

          if (hasOverlap) {
            continue; // Skip conflicting slot
          }

          screenSchedules[screen.id].push({ starts_at: startsAt, ends_at: endsAt });

          showsToInsert.push({
            movie_id: movie.id,
            screen_id: screen.id,
            starts_at: startsAt,
            ends_at: endsAt,
            language: movie.language || 'Hindi',
            format: isImax ? 'IMAX' : (screen.screen_type === '4K' ? '4K Laser' : '2D'),
            price_by_category: pricing,
            status: 'scheduled'
          });
        }

        screenIdx++;
      }
    }
  }

  console.log(`  Prepared ${showsToInsert.length} shows across 30 days.`);
  console.log('  Inserting shows in chunks of 100...');

  const INSERT_CHUNK = 100;
  let insertedCount = 0;
  for (let i = 0; i < showsToInsert.length; i += INSERT_CHUNK) {
    const chunk = showsToInsert.slice(i, i + INSERT_CHUNK);
    const { error: insErr } = await supabaseAdmin.from('shows').insert(chunk);
    if (insErr) {
      console.warn(`  Warning on chunk ${i / INSERT_CHUNK}:`, insErr.message);
    } else {
      insertedCount += chunk.length;
    }
  }

  console.log(`\nSuccessfully inserted ${insertedCount} scheduled shows!`);

  // Step 6: Verification
  console.log('\nStep 6: Verifying schedule integrity and pricing...');
  let verifyShows = [];
  page = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from('shows')
      .select('id, movie_id, starts_at, price_by_category, movies(title), screens(theatre_id, theatres(city))')
      .gte('starts_at', '2026-11-18T00:00:00.000Z')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    verifyShows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Total future shows in database: ${verifyShows.length}`);

  let zeroOrInvalidPrices = 0;
  for (const s of verifyShows) {
    let p = s.price_by_category;
    if (typeof p === 'string') {
      try { p = JSON.parse(p); } catch {}
    }
    const vals = Object.values(p || {}).map(Number);
    if (vals.length === 0 || vals.some(v => isNaN(v) || v <= 0)) {
      zeroOrInvalidPrices++;
    }
  }
  console.log(`Shows with zero or invalid prices: ${zeroOrInvalidPrices} (Target: 0)`);

  // City coverage check
  const cityCoverage = {};
  for (const s of verifyShows) {
    const city = s.screens?.theatres?.city;
    if (city) cityCoverage[city] = (cityCoverage[city] || 0) + 1;
  }
  console.log('\nCity show distribution:');
  for (const [city, count] of Object.entries(cityCoverage)) {
    console.log(`  - ${city}: ${count} shows`);
  }

  console.log('\n=====================================================');
  console.log('   SCHEDULE & PRICING GENERATION COMPLETED 100%      ');
  console.log('=====================================================\n');
}

run().catch((err) => {
  console.error('[FATAL SCHEDULER ERROR]:', err);
  process.exit(1);
});
