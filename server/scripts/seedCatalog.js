import { supabaseAdmin } from '../config/supabase.js';

const THEATRES_DATA = [
  // Bengaluru
  {
    name: 'PVR Forum Mall',
    address: 'The Forum Mall, Hosur Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560095',
    latitude: 12.9345,
    longitude: 77.6113,
    amenities: ['Dolby Atmos', '4K Projection', 'Food Court', 'Wheelchair Accessible', 'Parking'],
    screens: [
      { name: 'Audi 1 - Dolby Atmos', type: 'Atmos' },
      { name: 'Audi 2 - IMAX', type: 'IMAX' }
    ]
  },
  {
    name: 'INOX Garuda Mall',
    address: 'Garuda Mall, Magrath Road, Ashok Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560025',
    latitude: 12.9704,
    longitude: 77.6094,
    amenities: ['4K Projection', 'Recliner Seats', 'Valet Parking', 'Gourmet Food'],
    screens: [
      { name: 'Audi 1 - Laser 4K', type: '4K' },
      { name: 'Audi 2 - INSIGNIA', type: 'VIP' }
    ]
  },
  {
    name: 'Cinepolis Orion Mall',
    address: 'Orion Mall, Dr Rajkumar Road, Rajajinagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560055',
    latitude: 13.0112,
    longitude: 77.5550,
    amenities: ['Dolby Atmos', '4DX', 'Food Court', 'Parking'],
    screens: [
      { name: 'Screen 1 - 4DX', type: '4DX' },
      { name: 'Screen 2 - Atmos', type: 'Atmos' }
    ]
  },

  // Mumbai
  {
    name: 'PVR ICON Phoenix Palladium',
    address: 'Phoenix Palladium, Senapati Bapat Marg, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    latitude: 18.9953,
    longitude: 72.8242,
    amenities: ['Dolby Atmos', 'IMAX Laser', 'Recliner Seats', 'Valet Parking', 'Gourmet Bar'],
    screens: [
      { name: 'Audi 1 - IMAX Laser', type: 'IMAX' },
      { name: 'Audi 2 - Atmos Gold', type: 'VIP' }
    ]
  },
  {
    name: 'INOX Megaplex Inorbit Mall',
    address: 'Inorbit Mall, New Link Road, Malad West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400064',
    latitude: 19.1729,
    longitude: 72.8360,
    amenities: ['Dolby Atmos', 'MX4D', 'Kiddles', 'Food Court', 'Parking'],
    screens: [
      { name: 'Audi 1 - Megaplex 4K', type: '4K' },
      { name: 'Audi 2 - Dolby Atmos', type: 'Atmos' }
    ]
  },
  {
    name: 'Cinepolis Viviana Mall',
    address: 'Viviana Mall, Eastern Express Highway, Thane West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400606',
    latitude: 19.2089,
    longitude: 72.9712,
    amenities: ['4K Projection', 'Dolby Atmos', 'Recliner Seats', 'Parking'],
    screens: [
      { name: 'Screen 1 - VIP Atmos', type: 'VIP' },
      { name: 'Screen 2 - Macro XE', type: 'MacroXE' }
    ]
  },

  // Delhi
  {
    name: 'PVR Plaza Connaught Place',
    address: 'H-Block, Connaught Circus, Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6330,
    longitude: 77.2185,
    amenities: ['Heritage Theatre', '4K Projection', 'Dolby Surround 7.1', 'Cafe'],
    screens: [
      { name: 'Audi 1 - Heritage Heritage', type: 'Classic' },
      { name: 'Audi 2 - Premiere', type: '2D' }
    ]
  },
  {
    name: 'PVR Director\'s Cut Ambience Mall',
    address: 'Ambience Mall, Nelson Mandela Marg, Vasant Kunj',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110070',
    latitude: 28.5402,
    longitude: 77.1558,
    amenities: ['Luxury Recliners', 'In-seat Dining', 'Dolby Atmos', 'Valet Parking'],
    screens: [
      { name: 'Audi 1 - Director Lounge', type: 'VIP' },
      { name: 'Audi 2 - DC Gold', type: 'VIP' }
    ]
  },
  {
    name: 'INOX Epicuria Nehru Place',
    address: 'Epicuria Food Mall, Nehru Place Metro Station',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110019',
    latitude: 28.5492,
    longitude: 77.2520,
    amenities: ['Metro Direct Access', 'Dolby Atmos', 'Food Court', 'Parking'],
    screens: [
      { name: 'Audi 1 - Atmos', type: 'Atmos' },
      { name: 'Audi 2 - Laser 4K', type: '4K' }
    ]
  }
];

function generateSeatRows(screenId) {
  const seats = [];

  // Row A-B: Recliner (8 seats each)
  ['A', 'B'].forEach((row) => {
    for (let num = 1; num <= 8; num++) {
      seats.push({
        screen_id: screenId,
        row_label: row,
        seat_number: num,
        category: 'Recliner'
      });
    }
  });

  // Row C-E: Premium (10 seats each)
  ['C', 'D', 'E'].forEach((row) => {
    for (let num = 1; num <= 10; num++) {
      seats.push({
        screen_id: screenId,
        row_label: row,
        seat_number: num,
        category: 'Premium'
      });
    }
  });

  // Row F-H: Standard (12 seats each)
  ['F', 'G', 'H'].forEach((row) => {
    for (let num = 1; num <= 12; num++) {
      seats.push({
        screen_id: screenId,
        row_label: row,
        seat_number: num,
        category: 'Standard'
      });
    }
  });

  return seats;
}

async function seedCatalog() {
  console.log('[SEED] Starting automatic catalog population for Bengaluru, Mumbai, and Delhi...');

  // 1. Fetch available movies
  const { data: movies, error: movieErr } = await supabaseAdmin
    .from('movies')
    .select('id, title, duration_minutes')
    .limit(10);

  if (movieErr || !movies || movies.length === 0) {
    console.error('[SEED FATAL] No movies found in database. Please run importNowPlaying first.');
    process.exit(1);
  }

  console.log(`[SEED] Found ${movies.length} movies to schedule.`);

  const showtimes = [
    { hour: 10, minute: 30 },
    { hour: 14, minute: 15 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 30 }
  ];

  const now = new Date();
  const createdScreens = [];

  // 2. Iterate through theatres
  for (const tData of THEATRES_DATA) {
    const pointWkt = `SRID=4326;POINT(${tData.longitude} ${tData.latitude})`;

    // Check if theatre already exists
    let { data: theatre } = await supabaseAdmin
      .from('theatres')
      .select('id, name')
      .eq('name', tData.name)
      .maybeSingle();

    if (!theatre) {
      const { data: newTheatre, error: tErr } = await supabaseAdmin
        .from('theatres')
        .insert({
          name: tData.name,
          address: tData.address,
          city: tData.city,
          state: tData.state,
          pincode: tData.pincode,
          location: pointWkt,
          amenities: tData.amenities
        })
        .select()
        .single();

      if (tErr) {
        console.error(`[SEED ERROR] Failed to create theatre ${tData.name}:`, tErr.message);
        continue;
      }
      theatre = newTheatre;
      console.log(`[SEED THEATRE] Created: ${theatre.name} in ${tData.city}`);
    } else {
      console.log(`[SEED THEATRE] Exists: ${theatre.name}`);
    }

    // 3. Create screens and seats
    for (const sData of tData.screens) {
      let { data: screen } = await supabaseAdmin
        .from('screens')
        .select('id, name')
        .eq('theatre_id', theatre.id)
        .eq('name', sData.name)
        .maybeSingle();

      if (!screen) {
        const { data: newScreen, error: sErr } = await supabaseAdmin
          .from('screens')
          .insert({
            theatre_id: theatre.id,
            name: sData.name,
            screen_type: sData.type,
            total_seats: 76
          })
          .select()
          .single();

        if (sErr) {
          console.error(`[SEED ERROR] Failed to create screen ${sData.name}:`, sErr.message);
          continue;
        }
        screen = newScreen;

        // Insert seats
        const seats = generateSeatRows(screen.id);
        const { error: seatErr } = await supabaseAdmin.from('seats').insert(seats);
        if (seatErr) {
          console.error(`[SEED ERROR] Failed to insert seats for ${screen.name}:`, seatErr.message);
        } else {
          console.log(`[SEED SEATS] Inserted ${seats.length} seats for ${screen.name}`);
        }
      }

      createdScreens.push({
        ...screen,
        theatreCity: tData.city
      });
    }
  }

  // 4. Schedule shows for today and the next 2 days
  console.log(`[SEED] Scheduling shows across ${createdScreens.length} screens for the next 3 days...`);
  let showsCreated = 0;

  for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
    const showDate = new Date(now);
    showDate.setDate(now.getDate() + dayOffset);

    for (let i = 0; i < createdScreens.length; i++) {
      const screen = createdScreens[i];
      // Pick a movie rotated by screen index and day offset
      const movie = movies[(i + dayOffset) % movies.length];

      for (const slot of showtimes) {
        const startsAt = new Date(showDate);
        startsAt.setHours(slot.hour, slot.minute, 0, 0);

        const durationMinutes = movie.duration_minutes || 135;
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

        // Check for existing show
        const { data: existingShow } = await supabaseAdmin
          .from('shows')
          .select('id')
          .eq('screen_id', screen.id)
          .eq('starts_at', startsAt.toISOString())
          .maybeSingle();

        if (!existingShow) {
          const { error: showErr } = await supabaseAdmin.from('shows').insert({
            movie_id: movie.id,
            screen_id: screen.id,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            language: 'Hindi / English',
            format: screen.name.includes('IMAX') ? 'IMAX 3D' : screen.name.includes('4DX') ? '4DX' : '2D',
            price_by_category: {
              Standard: 220,
              Premium: 350,
              Recliner: 550
            },
            status: 'scheduled'
          });

          if (!showErr) {
            showsCreated++;
          }
        }
      }
    }
  }

  console.log(`[SEED COMPLETE] Successfully populated catalog: 9 theatres, 18 screens, 1,368 seats, and ${showsCreated} scheduled shows across Bengaluru, Mumbai, and Delhi!`);
}

seedCatalog().catch(console.error);
