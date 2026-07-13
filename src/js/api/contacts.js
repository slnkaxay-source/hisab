import { supabase } from './supabase.js';

export async function addContact(data) {
  try {
    const { data: result, error } = await supabase
      .from('contacts')
      .insert({
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone
      })
      .select()
      .single();
    return { data: result, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getContacts(userId) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteContact(id) {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function searchContacts(userId, query) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
