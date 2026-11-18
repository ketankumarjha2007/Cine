/**
 * deploy_sql_functions.mjs
 * Deploys updated get_show_seats and hold_seats SQL functions to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log('🚀 Testing Supabase connection and SQL functions...\n');

// Test that the functions exist and work correctly
async function testFunctions() {
  // Get a future scheduled show
  const { data: shows, error: showErr } = await supabase
    .from('shows')
    .select('id, price_by_category, starts_at')
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .limit(3);

  if (showErr) {
    console.log('❌ Could not fetch shows:', showErr.message);
    return;
  }

  console.log(`Found ${shows.length} future shows to test\n`);

  for (const show of shows) {
    console.log(`📽️  Show: ${show.id}`);
    console.log(`   starts_at: ${show.starts_at}`);
    console.log(`   price_by_category type: ${typeof show.price_by_category}`);
    console.log(`   price_by_category: ${JSON.stringify(show.price_by_category).substring(0, 120)}`);

    const { data: seats, error: seatsErr } = await supabase
      .rpc('get_show_seats', { p_show: show.id });

    if (seatsErr) {
      console.log(`   ❌ get_show_seats error: ${seatsErr.message}`);
    } else {
      const zeroPrices = seats?.filter(s => !s.price || s.price <= 0) || [];
      console.log(`   ✅ Seats returned: ${seats?.length}`);
      console.log(`   ❌ Zero-price seats: ${zeroPrices.length}`);
      if (seats?.length > 0) {
        const sample = seats[0];
        console.log(`   Sample seat: ${sample.row_label}${sample.seat_number} | ${sample.category} | ₹${sample.price} | ${sample.status}`);
      }
    }
    console.log('');
  }
}

async function checkPriceIssues() {
  console.log('🔍 Checking for ₹0 price issues in shows table...\n');

  const { data: shows, error } = await supabase
    .from('shows')
    .select('id, price_by_category, starts_at, status')
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .limit(100);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  let zeroPriceCount = 0;
  let stringTypeCount = 0;
  let validCount = 0;

  for (const show of shows) {
    const pbc = show.price_by_category;
    if (!pbc) {
      zeroPriceCount++;
    } else if (typeof pbc === 'string') {
      stringTypeCount++;
    } else {
      const values = Object.values(pbc);
      const hasZero = values.some(v => !v || Number(v) <= 0);
      if (hasZero) zeroPriceCount++;
      else validCount++;
    }
  }

  console.log(`📊 Price analysis of ${shows.length} upcoming shows:`);
  console.log(`   ✅ Valid prices: ${validCount}`);
  console.log(`   ⚠️  String-encoded prices: ${stringTypeCount}`);
  console.log(`   ❌ Zero/null prices: ${zeroPriceCount}`);

  if (stringTypeCount > 0 || zeroPriceCount > 0) {
    console.log('\n⚠️  Issues found! The SQL functions in the DB need to be updated.');
    console.log('📋 MANUAL DEPLOYMENT REQUIRED:');
    console.log('Go to Supabase Dashboard → SQL Editor and run the functions from:');
    console.log('supabase/03_functions.sql (get_show_seats at line 350, hold_seats at line 24)\n');
  } else {
    console.log('\n✅ All prices look valid!');
  }
}

async function main() {
  await testFunctions();
  await checkPriceIssues();
}

main().catch(console.error);
