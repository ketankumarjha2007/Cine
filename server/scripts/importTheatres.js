import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTheatres() {
  const filePath = path.resolve(__dirname, '../../supabase/data/theatres.template.json');
  console.log(`[SCRIPT] Reading theatres template from ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.error(`[SCRIPT ERROR] File not found: ${filePath}`);
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const theatres = fileData.theatres || [];

  if (theatres.length === 0) {
    console.log('[SCRIPT INFO] No theatres found in template file. Populating real theatres should be done via admin UI or adding real items to theatres.template.json.');
    return;
  }

  for (const t of theatres) {
    const pointWkt = `SRID=4326;POINT(${t.longitude} ${t.latitude})`;
    const { data, error } = await supabaseAdmin.from('theatres').insert({
      name: t.name,
      address: t.address,
      city: t.city,
      state: t.state,
      pincode: t.pincode,
      location: pointWkt,
      image_url: t.image_url || null,
      amenities: t.amenities || []
    }).select().single();

    if (error) {
      console.error(`[SCRIPT ERROR] Failed to import theatre ${t.name}:`, error.message);
    } else {
      console.log(`[SCRIPT SUCCESS] Imported theatre: ${data.name}`);
    }
  }
}

importTheatres();
