import { supabaseAdmin } from '../config/supabase.js';

async function setupWaveScreens() {
  const { data: wave } = await supabaseAdmin
    .from('theatres')
    .select('id, name')
    .ilike('name', '%Wave%')
    .single();

  if (!wave) {
    console.log('Wave Cinemas not found in theatres.');
    return;
  }

  const { data: existingScreens } = await supabaseAdmin
    .from('screens')
    .select('id, name')
    .eq('theatre_id', wave.id);

  if (existingScreens && existingScreens.length > 0) {
    console.log(`Wave Cinemas already has ${existingScreens.length} screens.`);
    return;
  }

  console.log(`Setting up screens & seats for ${wave.name}...`);

  const screensToInsert = [
    { theatre_id: wave.id, name: 'Audi 1 - Dolby Atmos', screen_type: '2D', total_seats: 72 },
    { theatre_id: wave.id, name: 'Audi 2 - Gold Class', screen_type: 'VIP', total_seats: 50 },
    { theatre_id: wave.id, name: 'Audi 3 - 4K Laser', screen_type: '2D', total_seats: 72 },
  ];

  const { data: newScreens, error: scErr } = await supabaseAdmin
    .from('screens')
    .insert(screensToInsert)
    .select();

  if (scErr) throw scErr;
  console.log(`Inserted ${newScreens.length} screens for Wave Cinemas.`);

  const seatRows = [];
  for (const sc of newScreens) {
    if (sc.screen_type === 'VIP') {
      // 5 rows of 10 seats
      const rows = ['A', 'B', 'C', 'D', 'E'];
      rows.forEach((r, ri) => {
        for (let num = 1; num <= 10; num++) {
          const cat = ri <= 1 ? 'Recliner' : 'Premium';
          seatRows.push({ screen_id: sc.id, row_label: r, seat_number: num, category: cat });
        }
      });
    } else {
      // 6 rows of 12 seats
      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      rows.forEach((r, ri) => {
        for (let num = 1; num <= 12; num++) {
          let cat = 'Standard';
          if (ri === 0) cat = 'Recliner';
          else if (ri <= 2) cat = 'Premium';
          seatRows.push({ screen_id: sc.id, row_label: r, seat_number: num, category: cat });
        }
      });
    }
  }

  const { error: stErr } = await supabaseAdmin.from('seats').insert(seatRows);
  if (stErr) throw stErr;

  console.log(`Inserted ${seatRows.length} seats for Wave Cinemas screens.`);
}

setupWaveScreens().catch(console.error);
