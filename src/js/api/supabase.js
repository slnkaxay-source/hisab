import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import CONFIG from '../config.js';

let supabase = null;

if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

export { supabase };
export default supabase;
