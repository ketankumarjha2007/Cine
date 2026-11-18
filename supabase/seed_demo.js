/**
 * seed_demo.js — CineTicket demo data seeder
 * Run: node seed_demo.js
 * Seeds ~1 month of movies, theatres, screens, seats, shows, bookings for demo purposes.
 * Uses the Supabase service-role key so bypasses RLS entirely.
 */

import { createClient } from '@supabase/supabase-js';

// Keys loaded from environment — never hardcode secrets in source
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell before running
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mxmimxtpxcjluzocsblh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function randomCode() {
  return 'CT' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 1. Movies ────────────────────────────────────────────────────────────────

const MOVIES = [
  {
    tmdb_id: 950387,
    title: 'Pushpa 2: The Rule',
    overview: 'Pushpa Raj continues his rise to power in the red sandalwood smuggling cartel and faces a fierce police officer determined to bring him down.',
    language: 'Telugu',
    genres: ['Action', 'Drama', 'Thriller'],
    duration_minutes: 179,
    release_date: isoDate(daysFromNow(-20)),
    certificate: 'A',
    poster_url: 'https://image.tmdb.org/t/p/w500/9zBGCgA9lHSGKJxTqp7oiCHFcMN.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/kHMHJxX0uGfqb7N1g2qVRBjExW2.jpg',
    trailer_key: 'tlZS2OxJTbo',
    rating: 8.1,
    status: 'now_showing',
  },
  {
    tmdb_id: 945961,
    title: 'Alien: Romulus',
    overview: 'A group of young colonists face the most terrifying life form in the universe while scavenging an abandoned space station.',
    language: 'English',
    genres: ['Science Fiction', 'Horror', 'Thriller'],
    duration_minutes: 119,
    release_date: isoDate(daysFromNow(-18)),
    certificate: 'A',
    poster_url: 'https://image.tmdb.org/t/p/w500/xomy3E6E2KHXkEYNvjAhCd58HVI.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/9SSEUrSqhljBMzRe4aBTh17LP9Q.jpg',
    trailer_key: 'x2bNUNVH6pA',
    rating: 7.4,
    status: 'now_showing',
  },
  {
    tmdb_id: 1100782,
    title: 'Stree 2',
    overview: 'The residents of Chanderi face a new supernatural threat and must work together with Stree to save their town.',
    language: 'Hindi',
    genres: ['Horror', 'Comedy'],
    duration_minutes: 136,
    release_date: isoDate(daysFromNow(-15)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/38YnmP7fN6K3B5sHi6R42BWp0Gr.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/yNFbVqNKB7TuYKt7qZ8K1GblKY5.jpg',
    trailer_key: 'VDoRBN0U9Og',
    rating: 7.9,
    status: 'now_showing',
  },
  {
    tmdb_id: 573435,
    title: 'Bad Boys: Ride or Die',
    overview: 'Miami detectives Mike Lowrey and Marcus Burnett go on the run after being framed by corrupt law enforcement.',
    language: 'English',
    genres: ['Action', 'Comedy', 'Crime'],
    duration_minutes: 115,
    release_date: isoDate(daysFromNow(-12)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/oGythE98MYleE6mZlGs5oBGkux1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/nv4F2HjJFkNy5cllCFMBM9sGIhF.jpg',
    trailer_key: 'qnOJuAKMvkI',
    rating: 7.2,
    status: 'now_showing',
  },
  {
    tmdb_id: 762441,
    title: 'A Quiet Place: Day One',
    overview: 'The origins of the creatures that hunt by sound are explored as a woman fights to survive the first day of their invasion of New York City.',
    language: 'English',
    genres: ['Horror', 'Science Fiction', 'Thriller'],
    duration_minutes: 99,
    release_date: isoDate(daysFromNow(-10)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/yrpPYKijwdMHyTGIOd1iK1h0Wo6.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/b9yFBFVFMXgYivhiUmfnMHKV4lq.jpg',
    trailer_key: 'L4P4DEaCDO4',
    rating: 7.0,
    status: 'now_showing',
  },
  {
    tmdb_id: 823464,
    title: 'Godzilla x Kong: The New Empire',
    overview: 'Two ancient titans, Godzilla and Kong, clash in an epic battle against a colossal undiscovered threat hidden within our world.',
    language: 'English',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    duration_minutes: 115,
    release_date: isoDate(daysFromNow(-8)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/fu9HyBzSfbFCFVhMlxFvNqp7Q4B.jpg',
    trailer_key: 'lV1J4E2kQ5A',
    rating: 7.1,
    status: 'now_showing',
  },
  {
    tmdb_id: 1105074,
    title: 'Kalki 2898 AD',
    overview: 'Set in a futuristic dystopian world, this mythological sci-fi epic follows the avatar of Vishnu destined to end darkness.',
    language: 'Telugu',
    genres: ['Action', 'Science Fiction', 'Mythology'],
    duration_minutes: 181,
    release_date: isoDate(daysFromNow(-5)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/5y8yUYRpwFUMB8WMBEw7wdBVhq0.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/pA3vdhadJPxF5GA1uo8OPTiNQDT.jpg',
    trailer_key: 'F8SJNPZK-o8',
    rating: 7.6,
    status: 'now_showing',
  },
  {
    tmdb_id: 912649,
    title: 'Venom: The Last Dance',
    overview: 'Eddie Brock and Venom go on the run, pursued by both worlds, in a final adventure that will change their lives forever.',
    language: 'English',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    duration_minutes: 109,
    release_date: isoDate(daysFromNow(-3)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/3V4kLQg0kSqne7zhRC3NLEhBc9A.jpg',
    trailer_key: 'VbJMsLuKr2Y',
    rating: 7.0,
    status: 'now_showing',
  },
  // Upcoming movies
  {
    tmdb_id: 558449,
    title: 'Gladiator II',
    overview: 'Years after the death of Maximus, Lucius must enter the Colosseum and fight for the survival of the Roman Empire.',
    language: 'English',
    genres: ['Action', 'Adventure', 'Drama'],
    duration_minutes: 148,
    release_date: isoDate(daysFromNow(10)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/tkFE9LTCbGi1gFSDLal1gMiCMOQ.jpg',
    trailer_key: 'BYX3V_mFAVE',
    rating: 7.8,
    status: 'upcoming',
  },
  {
    tmdb_id: 974262,
    title: 'Singham Again',
    overview: 'ACP Bajirao Singham returns for his most dangerous mission yet, bringing together a team of police officers in an epic showdown.',
    language: 'Hindi',
    genres: ['Action', 'Drama'],
    duration_minutes: 165,
    release_date: isoDate(daysFromNow(15)),
    certificate: 'UA',
    poster_url: 'https://image.tmdb.org/t/p/w500/xDMIl84Qy5Lg1MASRvvjmCldGD3.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/kSFnJB45Mgm0MJhHB0CRqCdlrGZ.jpg',
    trailer_key: 'fHpMBMGn7mU',
    rating: null,
    status: 'upcoming',
  },
  {
    tmdb_id: 1184918,
    title: 'The Wild Robot',
    overview: 'After a shipwreck, robot Roz must adapt to a harsh island environment and care for an orphaned gosling.',
    language: 'English',
    genres: ['Animation', 'Family', 'Science Fiction'],
    duration_minutes: 102,
    release_date: isoDate(daysFromNow(20)),
    certificate: 'U',
    poster_url: 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/417X2sEbGl2Z8zFDl5RwfT2AiN5.jpg',
    trailer_key: 'nYSPJF9WY-I',
    rating: 8.0,
    status: 'upcoming',
  },
];

// ── 2. Theatres ───────────────────────────────────────────────────────────────

const THEATRES = [
  {
    name: 'PVR Cinemas - Nexus Mall',
    address: 'Nexus Mall, Koramangala, Bengaluru - 560034',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    lat: 12.9352,
    lng: 77.6245,
    amenities: ['Food Court', 'Valet Parking', 'IMAX', 'Dolby Atmos', 'Recliner Seats'],
  },
  {
    name: 'INOX Leisure - Forum Mall',
    address: 'The Forum Shantiniketan, Whitefield, Bengaluru - 560048',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560048',
    lat: 12.9698,
    lng: 77.7500,
    amenities: ['Parking', 'Food Court', '4DX', 'Dolby Atmos'],
  },
  {
    name: 'Cinepolis - Orion Mall',
    address: 'Orion Mall, Rajajinagar, Bengaluru - 560010',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560010',
    lat: 13.0115,
    lng: 77.5551,
    amenities: ['Parking', 'Kids Zone', 'VIP Lounge'],
  },
  {
    name: 'PVR ICON - Phoenix Palassio',
    address: 'Phoenix Palassio, Lucknow - 226010',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010',
    lat: 26.8467,
    lng: 80.9462,
    amenities: ['Food Court', 'Dolby Atmos', 'Recliner Seats', 'Parking'],
  },
  {
    name: 'Carnival Cinemas - Fun Republic',
    address: 'Fun Republic Mall, Gomti Nagar, Lucknow - 226010',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010',
    lat: 26.8597,
    lng: 80.9977,
    amenities: ['Parking', 'Food Court'],
  },
  {
    name: 'INOX - Pacific Mall',
    address: 'Pacific Mall, Subhash Nagar, Delhi - 110027',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110027',
    lat: 28.6448,
    lng: 77.1310,
    amenities: ['Food Court', 'Dolby Atmos', 'IMAX', 'Parking'],
  },
  {
    name: 'PVR - Select City Walk',
    address: 'Select City Walk, Saket, Delhi - 110017',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110017',
    lat: 28.5244,
    lng: 77.2066,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'Recliner Seats'],
  },
  {
    name: 'Cinepolis - Viviana Mall',
    address: 'Viviana Mall, Thane West, Mumbai - 400601',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400601',
    lat: 19.2183,
    lng: 72.9781,
    amenities: ['Parking', 'Food Court', '4DX', 'Dolby Atmos'],
  },
  {
    name: 'PVR ICON - Infinity Mall',
    address: 'Infinity Mall, Andheri West, Mumbai - 400058',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400058',
    lat: 19.1235,
    lng: 72.8347,
    amenities: ['Parking', 'Food Court', 'IMAX', 'Recliner Seats'],
  },
];

// ── 3. Screen layouts ────────────────────────────────────────────────────────

const SCREEN_TEMPLATES = [
  { name: 'Screen 1', screen_type: '2D', rows: ['A','B','C','D','E','F'], seatsPerRow: 12 },
  { name: 'Screen 2 - Premium', screen_type: '2D', rows: ['A','B','C','D','E'], seatsPerRow: 10 },
  { name: 'Screen 3 - IMAX', screen_type: 'IMAX', rows: ['A','B','C','D','E','F','G','H'], seatsPerRow: 14 },
];

function buildSeats(screenId, rows, seatsPerRow) {
  const seats = [];
  rows.forEach((row, ri) => {
    for (let n = 1; n <= seatsPerRow; n++) {
      let category = 'Standard';
      if (ri === 0) category = 'VIP';
      else if (ri === 1) category = 'Premium';
      seats.push({ screen_id: screenId, row_label: row, seat_number: n, category });
    }
  });
  return seats;
}

// ── Show times ─────────────────────────────────────────────────────────────

const SHOW_SLOTS = [
  { hour: 9, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 16, minute: 30 },
  { hour: 20, minute: 0 },
];

// ── Main seeder ──────────────────────────────────────────────────────────────

async function upsertMovies() {
  console.log('Upserting movies...');
  const { data, error } = await supabase
    .from('movies')
    .upsert(MOVIES, { onConflict: 'tmdb_id', ignoreDuplicates: false })
    .select('id, title');
  if (error) throw new Error('Movies upsert failed: ' + error.message);
  console.log(`  ${data.length} movies ready.`);
  return data; // [{id, title}]
}

async function upsertTheatres() {
  console.log('Upserting theatres...');
  const rows = THEATRES.map((t) => ({
    name: t.name,
    address: t.address,
    city: t.city,
    state: t.state,
    pincode: t.pincode,
    location: `POINT(${t.lng} ${t.lat})`,
    amenities: t.amenities,
  }));
  // Check existing by name to avoid duplicates
  const { data: existing } = await supabase.from('theatres').select('id, name');
  const existingNames = new Set((existing || []).map((e) => e.name));
  const toInsert = rows.filter((r) => !existingNames.has(r.name));
  let inserted = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase.from('theatres').insert(toInsert).select('id, name, city');
    if (error) throw new Error('Theatres insert failed: ' + error.message);
    inserted = data;
  }
  const all = [...(existing || []).filter((e) => THEATRES.some((t) => t.name === e.name)), ...inserted];
  // Reload full rows
  const { data: full } = await supabase.from('theatres').select('id, name, city').in('name', THEATRES.map((t) => t.name));
  console.log(`  ${full.length} theatres ready.`);
  return full;
}

async function createScreensAndSeats(theatres) {
  console.log('Creating screens & seats...');
  const screenMap = {}; // theatreName -> [{id, template}]

  for (const theatre of theatres) {
    const tmpl = THEATRES.find((t) => t.name === theatre.name);
    if (!tmpl) continue;

    // Check existing screens for this theatre
    const { data: existingScreens } = await supabase
      .from('screens').select('id, name').eq('theatre_id', theatre.id);
    const existingNames = new Set((existingScreens || []).map((s) => s.name));

    const screenRows = [];
    for (const tpl of SCREEN_TEMPLATES) {
      if (!existingNames.has(tpl.name)) {
        const totalSeats = tpl.rows.length * tpl.seatsPerRow;
        screenRows.push({ theatre_id: theatre.id, name: tpl.name, screen_type: tpl.screen_type, total_seats: totalSeats });
      }
    }

    let newScreens = [];
    if (screenRows.length > 0) {
      const { data, error } = await supabase.from('screens').insert(screenRows).select('id, name');
      if (error) throw new Error(`Screens insert failed for ${theatre.name}: ` + error.message);
      newScreens = data;
    }

    const allScreens = [...(existingScreens || []), ...newScreens];
    screenMap[theatre.name] = allScreens;

    // Insert seats for newly created screens
    for (const screen of newScreens) {
      const tpl = SCREEN_TEMPLATES.find((t) => t.name === screen.name);
      if (!tpl) continue;
      const seatRows = buildSeats(screen.id, tpl.rows, tpl.seatsPerRow);
      const { error: sErr } = await supabase.from('seats').insert(seatRows);
      if (sErr) console.warn(`  Seats insert warn for screen ${screen.name}: `, sErr.message);
    }
  }

  console.log('  Screens & seats ready.');
  return screenMap;
}

async function createShows(movies, theatres, screenMap) {
  console.log('Creating shows for the next 30 days...');

  // Pick now-showing movies
  const nowShowing = movies.filter((m) => {
    const dbM = MOVIES.find((dm) => dm.title === m.title);
    return dbM?.status === 'now_showing';
  });

  if (nowShowing.length === 0) {
    console.warn('  No now-showing movies found.');
    return;
  }

  const showsToInsert = [];

  // For each theatre, for each screen, create shows across 30 days
  for (const theatre of theatres) {
    const screens = screenMap[theatre.name] || [];
    for (const screen of screens) {
      // Rotate movies across screens
      const moviePool = nowShowing;
      let movieIdx = 0;

      for (let day = 0; day <= 30; day++) {
        const date = daysFromNow(day - 5); // start 5 days ago for history
        const movie = moviePool[movieIdx % moviePool.length];
        const dbMovie = MOVIES.find((dm) => dm.title === movie.title);
        const durationMin = dbMovie?.duration_minutes || 120;

        // Pick 2-3 slots per day per screen
        const slots = day % 3 === 0 ? SHOW_SLOTS : SHOW_SLOTS.slice(1); // vary
        for (const slot of slots) {
          const startsAt = isoTs(date, slot.hour, slot.minute);
          const endsAt = new Date(new Date(startsAt).getTime() + (durationMin + 20) * 60000).toISOString();

          showsToInsert.push({
            movie_id: movie.id,
            screen_id: screen.id,
            starts_at: startsAt,
            ends_at: endsAt,
            language: dbMovie?.language || 'Hindi',
            format: screen.screen_type === 'IMAX' ? 'IMAX' : '2D',
            price_by_category: JSON.stringify({ Standard: 180, Premium: 300, VIP: 450 }),
            status: 'scheduled',
          });
        }
        movieIdx++;
      }
    }
  }

  // Insert in chunks of 50 to avoid payload limit; skip overlap conflicts gracefully
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < showsToInsert.length; i += CHUNK) {
    const chunk = showsToInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from('shows').insert(chunk);
    if (error) {
      // Overlap or duplicate — skip chunk, log warning
      console.warn(`  Shows chunk ${i / CHUNK} skipped (overlap/dup): `, error.message.substring(0, 80));
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`  ${inserted} shows created (some may have been skipped due to overlap).`);
}

async function createDemoBookings(movies, theatres) {
  console.log('Creating demo confirmed bookings...');

  // Get a few shows to attach bookings to
  const { data: shows, error: sErr } = await supabase
    .from('shows')
    .select('id, movie_id, screen_id, starts_at, price_by_category')
    .gte('starts_at', daysFromNow(-28).toISOString())
    .lte('starts_at', daysFromNow(-1).toISOString())
    .eq('status', 'scheduled')
    .limit(20);

  if (sErr || !shows || shows.length === 0) {
    console.warn('  No past shows found to attach demo bookings to.');
    return;
  }

  // Get admin user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(5);

  if (!profiles || profiles.length === 0) {
    console.warn('  No user profiles found. Skipping demo bookings.');
    return;
  }

  const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CANCELLED'];
  let bookingCount = 0;

  for (let i = 0; i < Math.min(shows.length, 15); i++) {
    const show = shows[i];
    const user = profiles[i % profiles.length];
    const status = statuses[i % statuses.length];

    // Get some seats for this screen
    const { data: seats } = await supabase
      .from('seats')
      .select('id, category, row_label, seat_number')
      .eq('screen_id', show.screen_id)
      .limit(3);

    if (!seats || seats.length === 0) continue;

    const prices = typeof show.price_by_category === 'string'
      ? JSON.parse(show.price_by_category)
      : show.price_by_category;

    let subtotal = 0;
    seats.forEach((s) => { subtotal += prices[s.category] || 180; });
    const convenience_fee = Math.round(subtotal * 0.0);
    const total_amount = subtotal + convenience_fee;

    const confirmedAt = new Date(show.starts_at);
    confirmedAt.setHours(confirmedAt.getHours() - 2);

    const bookingPayload = {
      user_id: user.id,
      show_id: show.id,
      status,
      subtotal,
      convenience_fee,
      total_amount,
      hold_expires_at: confirmedAt.toISOString(),
      booking_code: randomCode(),
      created_at: confirmedAt.toISOString(),
      confirmed_at: status === 'CONFIRMED' ? confirmedAt.toISOString() : null,
      cancelled_at: status === 'CANCELLED' ? confirmedAt.toISOString() : null,
      email_sent: status === 'CONFIRMED',
    };

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert(bookingPayload)
      .select('id')
      .single();

    if (bErr) {
      console.warn(`  Booking insert skipped: `, bErr.message.substring(0, 80));
      continue;
    }

    // Insert booking_seats
    const bookingSeats = seats.map((s) => ({
      booking_id: booking.id,
      show_id: show.id,
      seat_id: s.id,
      price: prices[s.category] || 180,
      status: status === 'CONFIRMED' ? 'BOOKED' : 'RELEASED',
    }));

    const { error: bsErr } = await supabase.from('booking_seats').insert(bookingSeats);
    if (bsErr) {
      // Might conflict with existing holds — delete booking and skip
      await supabase.from('bookings').delete().eq('id', booking.id);
      console.warn(`  BookingSeats conflict for booking, rolled back.`);
      continue;
    }

    // Insert a payment record for CONFIRMED bookings
    if (status === 'CONFIRMED') {
      await supabase.from('payments').insert({
        booking_id: booking.id,
        razorpay_order_id: 'order_demo_' + booking.id.substring(0, 8),
        razorpay_payment_id: 'pay_demo_' + booking.id.substring(0, 8),
        razorpay_signature: 'sig_demo',
        amount: total_amount,
        currency: 'INR',
        status: 'PAID',
      });
    }

    bookingCount++;
  }

  console.log(`  ${bookingCount} demo bookings created.`);
}

async function run() {
  console.log('\n=== CineTicket Demo Seeder ===\n');
  try {
    const movies = await upsertMovies();
    const theatres = await upsertTheatres();
    const screenMap = await createScreensAndSeats(theatres);
    await createShows(movies, theatres, screenMap);
    await createDemoBookings(movies, theatres);
    console.log('\n=== Seeding complete! ===\n');
  } catch (err) {
    console.error('\n[SEED ERROR]', err.message);
    process.exit(1);
  }
}

run();
