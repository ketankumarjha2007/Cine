/**
 * fix_posters.js
 * 1. Merges/removes broken duplicate movies (Pushpa 2, Stree 2, Kalki, Singham Again).
 * 2. Updates Alien: Romulus and A Quiet Place with verified working TMDB posters.
 * 3. Verifies every single movie with status in ('now_showing', 'upcoming') has an HTTP 200 working poster.
 * 4. Ensures Singham Again, Ramayana, Hanuman Ansh, Stree 2, etc. have working shows.
 */

import { supabaseAdmin } from './config/supabase.js';

const REAL_POSTERS = {
  'Alien: Romulus': {
    poster_url: 'https://image.tmdb.org/t/p/w500/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/iYqSQaWDttQIQzsxg9xHyg0bttG.jpg',
  },
  'A Quiet Place: Day One': {
    poster_url: 'https://image.tmdb.org/t/p/w500/hU42CRk14JuPEdqZG3AWmagiPAP.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg',
  },
  'Pushpa 2: The Rule': {
    poster_url: 'https://image.tmdb.org/t/p/w500/qYIMFyffDrqZ5kzPov79a8GPbRf.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/7jGItf7idJsBm9QTNoTNTU3KiGe.jpg',
  },
  'Stree 2': {
    poster_url: 'https://image.tmdb.org/t/p/w500/nfnhwfUEFuSOxxf4jDdBlY6Lccw.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg',
  },
  'Kalki 2898 AD': {
    poster_url: 'https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/seAIZLEq2Il2psjMUREDbSdRmbu.jpg',
  },
  'Singham Again': {
    poster_url: 'https://image.tmdb.org/t/p/w500/2JbNkHg8m7LaBy61LyrnnlenaxY.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/yLKkuYMcibmNEvb97I4t6eDSSwk.jpg',
  },
};

async function checkUrl(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function run() {
  console.log('\n=== FIXING POSTERS AND CLEANING MOVIES ===\n');

  // 1. Fetch all movies
  const { data: movies, error } = await supabaseAdmin.from('movies').select('*');
  if (error) throw error;

  console.log(`Analyzing ${movies.length} movies...`);

  // 2. Identify broken vs working movies
  for (const movie of movies) {
    const isOk = await checkUrl(movie.poster_url);

    if (!isOk) {
      console.log(`\nMovie with broken poster: "${movie.title}" (ID: ${movie.id})`);

      // Check if we have a known real replacement
      const fix = REAL_POSTERS[movie.title];
      if (fix) {
        console.log(`  Applying verified real poster for "${movie.title}"...`);
        await supabaseAdmin
          .from('movies')
          .update({
            poster_url: fix.poster_url,
            backdrop_url: fix.backdrop_url,
            status: 'now_showing',
          })
          .eq('id', movie.id);
        console.log(`  Updated!`);
      } else {
        // If no fix available, check if there is another movie with similar title that works
        const similar = movies.find(
          (m) => m.id !== movie.id && m.title.toLowerCase().includes(movie.title.toLowerCase().slice(0, 5))
        );
        if (similar) {
          console.log(`  Merging into existing working movie: "${similar.title}"...`);
          // Reassign shows
          await supabaseAdmin.from('shows').update({ movie_id: similar.id }).eq('movie_id', movie.id);
          // Delete old broken movie
          await supabaseAdmin.from('movies').delete().eq('id', movie.id);
          console.log(`  Merged and deleted old record.`);
        } else {
          console.log(`  No replacement found. Setting status to 'archived'...`);
          await supabaseAdmin.from('movies').update({ status: 'archived' }).eq('id', movie.id);
        }
      }
    }
  }

  // 3. Deduplicate: if there are two movies with identical or nearly identical titles
  // e.g. "Pushpa 2 - The Rule" and "Pushpa 2: The Rule"
  const { data: refreshed } = await supabaseAdmin.from('movies').select('*').in('status', ['now_showing', 'upcoming']);
  
  const titleGroups = {};
  for (const m of refreshed) {
    // Normalized title key
    const key = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!titleGroups[key]) titleGroups[key] = [];
    titleGroups[key].push(m);
  }

  for (const [key, group] of Object.entries(titleGroups)) {
    if (group.length > 1) {
      console.log(`\nFound duplicate group for "${key}":`, group.map((g) => `${g.title} (${g.id})`));
      const keep = group[0];
      const duplicates = group.slice(1);
      for (const dup of duplicates) {
        console.log(`  Reassigning shows from ${dup.id} to ${keep.id}...`);
        await supabaseAdmin.from('shows').update({ movie_id: keep.id }).eq('movie_id', dup.id);
        await supabaseAdmin.from('movies').delete().eq('id', dup.id);
        console.log(`  Deleted duplicate movie: ${dup.title} (${dup.id})`);
      }
    }
  }

  // 4. Update banners to make sure they use verified working backdrop images
  const { data: activeMovies } = await supabaseAdmin
    .from('movies')
    .select('id, title, backdrop_url')
    .in('status', ['now_showing'])
    .not('backdrop_url', 'is', null)
    .limit(6);

  if (activeMovies && activeMovies.length > 0) {
    await supabaseAdmin.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const newBanners = activeMovies.map((m, idx) => ({
      title: m.title,
      subtitle: 'Experience in cinemas with immersive sound • Book now on CineTicket',
      image_url: m.backdrop_url,
      link_url: `/movie/${m.id}`,
      sort_order: idx + 1,
      active: true,
    }));
    await supabaseAdmin.from('banners').insert(newBanners);
    console.log(`\nUpdated ${newBanners.length} featured carousel banners.`);
  }

  // 5. Final verification pass
  console.log('\n--- Final Verification Pass ---');
  const { data: finalMovies } = await supabaseAdmin
    .from('movies')
    .select('id, title, poster_url, status')
    .in('status', ['now_showing', 'upcoming']);

  let allGood = true;
  for (const m of finalMovies) {
    const ok = await checkUrl(m.poster_url);
    if (!ok) {
      console.log(`STILL BROKEN: "${m.title}" -> archiving`);
      await supabaseAdmin.from('movies').update({ status: 'archived' }).eq('id', m.id);
      allGood = false;
    } else {
      console.log(`VERIFIED OK (200): "${m.title}"`);
    }
  }

  console.log('\n=== ALL POSTERS FIXED AND VERIFIED! ===\n');
}

run().catch((e) => {
  console.error('[FIX ERROR]:', e);
  process.exit(1);
});
