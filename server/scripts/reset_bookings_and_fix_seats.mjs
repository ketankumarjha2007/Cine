/**
 * reset_bookings_and_fix_seats.mjs
 * 
 * 1. Clear out demo bookings, booking_seats, and payments so revenue and booking
 *    metrics start completely clean (0), and will accurately update ONLY when the user
 *    makes real bookings.
 * 
 * 2. Re-assign seat categories to match authentic movie theatre seating layouts:
 *    - Front rows (A, B, C) near the screen: 'Standard' (affordable, closest to screen)
 *    - Middle rows (D, E, F): 'Premium' (optimal viewing angle)
 *    - Back rows (G, H / last rows): 'Recliner' (luxury seating farthest from screen)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🧹 [1/3] Clearing demo bookings, booking_seats, and payments...');

  // 1. Delete all booking_seats
  const { error: bsErr } = await supabase
    .from('booking_seats')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (bsErr) console.error('Error deleting booking_seats:', bsErr.message);
  else console.log('✅ Cleared booking_seats');

  // 2. Delete all payments
  const { error: pErr } = await supabase
    .from('payments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (pErr) console.error('Error deleting payments:', pErr.message);
  else console.log('✅ Cleared payments');

  // 3. Delete all bookings
  const { error: bErr } = await supabase
    .from('bookings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (bErr) console.error('Error deleting bookings:', bErr.message);
  else console.log('✅ Cleared bookings');

  console.log('\n💺 [2/3] Updating seat categories to realistic cinema layout...');
  console.log('   - Rows A, B, C (Near Screen) -> Standard');
  console.log('   - Rows D, E, F (Middle)      -> Premium');
  console.log('   - Rows G, H+   (Back rows)   -> Recliner');

  // Update rows A, B, C to Standard
  const { error: stdErr } = await supabase
    .from('seats')
    .update({ category: 'Standard' })
    .in('row_label', ['A', 'B', 'C']);
  if (stdErr) console.error('Error setting Standard seats:', stdErr.message);
  else console.log('✅ Set Rows A, B, C to Standard');

  // Update rows D, E, F to Premium
  const { error: premErr } = await supabase
    .from('seats')
    .update({ category: 'Premium' })
    .in('row_label', ['D', 'E', 'F']);
  if (premErr) console.error('Error setting Premium seats:', premErr.message);
  else console.log('✅ Set Rows D, E, F to Premium');

  // Update rows G, H, I, J to Recliner
  const { error: recErr } = await supabase
    .from('seats')
    .update({ category: 'Recliner' })
    .in('row_label', ['G', 'H', 'I', 'J', 'K']);
  if (recErr) console.error('Error setting Recliner seats:', recErr.message);
  else console.log('✅ Set Rows G, H+ to Recliner');

  console.log('\n🔍 [3/3] Verifying database state...');

  // Check bookings count
  const { count: bCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 Bookings in DB: ${bCount || 0} (Starts clean! Will update on real bookings)`);

  // Check seats distribution
  const { data: sampleSeats } = await supabase
    .from('seats')
    .select('row_label, category')
    .limit(200);

  const rowMap = {};
  for (const s of sampleSeats || []) {
    rowMap[s.row_label] = s.category;
  }
  console.log('🪑 Seat row layout:');
  Object.keys(rowMap).sort().forEach(row => {
    console.log(`   Row ${row} (near screen -> back): ${rowMap[row]}`);
  });

  console.log('\n🎉 Real cinema layout and clean analytics ready!');
}

main().catch(console.error);
