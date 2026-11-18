import { supabaseAdmin } from '../config/supabase.js';

function istToIsoString(year, month, day, hour, minute) {
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  dt.setUTCMinutes(dt.getUTCMinutes() - 330);
  return dt.toISOString();
}

export const scheduleService = {
  /**
   * Generates or refreshes a rolling 30-day schedule starting from startDate
   */
  async generateRollingSchedule({ startDate = new Date(), daysAhead = 30 } = {}) {
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
      .select('id, title, duration_minutes, language, status, certificate')
      .in('title', TARGET_TITLES);

    if (mErr || !movies || movies.length === 0) {
      throw new Error('No target movies found for scheduling');
    }

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

    const theatreScreensMap = {};
    for (const t of theatres) {
      theatreScreensMap[t.id] = screens.filter((s) => s.theatre_id === t.id);
    }

    // Preserve shows that have existing bookings
    const fromIso = startDate.toISOString();
    const { data: bookedShows } = await supabaseAdmin
      .from('bookings')
      .select('show_id, shows!inner(starts_at)')
      .gte('shows.starts_at', fromIso);

    const bookedShowIds = new Set((bookedShows || []).map((b) => b.show_id));

    // Clear unbooked future shows within range
    let showsToDelete = [];
    let page = 0;
    while (true) {
      const { data } = await supabaseAdmin
        .from('shows')
        .select('id')
        .gte('starts_at', fromIso)
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (!data || data.length === 0) break;
      const unbooked = data.filter((s) => !bookedShowIds.has(s.id));
      showsToDelete.push(...unbooked);
      if (data.length < 1000) break;
      page++;
    }

    const DEL_CHUNK = 200;
    for (let i = 0; i < showsToDelete.length; i += DEL_CHUNK) {
      const ids = showsToDelete.slice(i, i + DEL_CHUNK).map((s) => s.id);
      await supabaseAdmin.from('booking_seats').delete().in('show_id', ids);
      await supabaseAdmin.from('shows').delete().in('id', ids);
    }

    const SCREEN_SLOT_TEMPLATES = [
      [
        { hour: 9, minute: 30 },
        { hour: 13, minute: 15 },
        { hour: 17, minute: 0 },
        { hour: 20, minute: 45 }
      ],
      [
        { hour: 10, minute: 0 },
        { hour: 13, minute: 45 },
        { hour: 17, minute: 30 },
        { hour: 21, minute: 15 }
      ],
      [
        { hour: 10, minute: 30 },
        { hour: 14, minute: 15 },
        { hour: 18, minute: 0 },
        { hour: 21, minute: 45 }
      ],
      [
        { hour: 11, minute: 0 },
        { hour: 14, minute: 45 },
        { hour: 18, minute: 30 },
        { hour: 22, minute: 15 }
      ],
      [
        { hour: 10, minute: 15 },
        { hour: 14, minute: 0 },
        { hour: 17, minute: 45 },
        { hour: 21, minute: 30 }
      ]
    ];

    const showsToInsert = [];
    const screenSchedules = {};

    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + dayOffset);

      const year = curDate.getFullYear();
      const month = curDate.getMonth() + 1;
      const day = curDate.getDate();
      const dayOfWeek = curDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

      let globalMovieIdx = dayOffset * 3;

      for (const theatre of theatres) {
        const thScreens = theatreScreensMap[theatre.id] || [];
        if (thScreens.length === 0) continue;

        let screenIdx = 0;
        for (const screen of thScreens) {
          const slots = SCREEN_SLOT_TEMPLATES[screenIdx % SCREEN_SLOT_TEMPLATES.length];
          const isImax = (screen.screen_type || '').toUpperCase().includes('IMAX');

          const pricing = isImax
            ? {
                Standard: isWeekend ? 380 : 350,
                Premium: isWeekend ? 550 : 500,
                VIP: isWeekend ? 700 : 650,
                Recliner: isWeekend ? 800 : 750
              }
            : {
                Standard: isWeekend ? 250 : 220,
                Premium: isWeekend ? 380 : 350,
                VIP: isWeekend ? 550 : 500,
                Recliner: isWeekend ? 600 : 550
              };

          for (const slot of slots) {
            const movie = movies[globalMovieIdx % movies.length];
            globalMovieIdx++;

            const startsAt = istToIsoString(year, month, day, slot.hour, slot.minute);
            const duration = movie.duration_minutes || 135;
            const endsAt = new Date(new Date(startsAt).getTime() + (duration + 20) * 60000).toISOString();

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

            if (hasOverlap) continue;

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

    const INSERT_CHUNK = 100;
    let insertedCount = 0;
    for (let i = 0; i < showsToInsert.length; i += INSERT_CHUNK) {
      const chunk = showsToInsert.slice(i, i + INSERT_CHUNK);
      const { error: insErr } = await supabaseAdmin.from('shows').insert(chunk);
      if (!insErr) {
        insertedCount += chunk.length;
      }
    }

    return {
      success: true,
      totalScheduled: insertedCount,
      daysAhead,
      theatresCount: theatres.length,
      screensCount: screens.length,
      moviesCount: movies.length
    };
  },

  async getScheduleSummary() {
    const nowIso = new Date().toISOString();
    const { count: totalFutureShows, error } = await supabaseAdmin
      .from('shows')
      .select('id', { count: 'exact', head: true })
      .gte('starts_at', nowIso)
      .eq('status', 'scheduled');

    if (error) throw error;

    return {
      activeFutureShows: totalFutureShows || 0,
      rollingDays: 30
    };
  }
};
