import CONFIG from '../config.js';

let supabase = null;

if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && typeof window.supabase !== 'undefined') {
  supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

export { supabase };
export default supabase;
