import { supabase } from './supabase.js';

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getProfileByEmail(email) {
  try {
    const { data, error } = await supabase
      .rpc('lookup_user_by_email', { email_to_find: email });
    if (error) return { data: null, error };
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
