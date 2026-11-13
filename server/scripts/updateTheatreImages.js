import { supabaseAdmin } from '../config/supabase.js';

const THEATRE_IMAGES = {
  'PVR Forum Mall': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  'INOX Garuda Mall': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  'Cinepolis Orion Mall': 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=800&q=80',
  'PVR ICON Phoenix Palladium': 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=800&q=80',
  'INOX Megaplex Inorbit Mall': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
  'Cinepolis Viviana Mall': 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=800&q=80',
  'PVR Plaza Connaught Place': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
  'PVR Director\'s Cut Ambience Mall': 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=800&q=80',
  'INOX Epicuria Nehru Place': 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80'
};

async function updateTheatreImages() {
  console.log('[SCRIPT] Updating theatre images with real cinema photos...');
  for (const [name, imageUrl] of Object.entries(THEATRE_IMAGES)) {
    const { error } = await supabaseAdmin
      .from('theatres')
      .update({ image_url: imageUrl })
      .eq('name', name);

    if (error) {
      console.error(`[ERROR] Failed to update ${name}:`, error.message);
    } else {
      console.log(`[SUCCESS] Updated image for: ${name}`);
    }
  }
}

updateTheatreImages();
