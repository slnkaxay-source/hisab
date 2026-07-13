import CONFIG from '../config.js';

let supabase = null;

if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
  const { createClient } = await import('https://unpkg.com/@supabase/supabase-js@2');
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

export { supabase };
export default supabase;
