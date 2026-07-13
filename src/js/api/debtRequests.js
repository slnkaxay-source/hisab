import { supabase } from './supabase.js';

export async function createRequest(data) {
  try {
    const { data: result, error } = await supabase
      .from('debt_requests')
      .insert({
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        receiver_email: data.receiver_email,
        amount: data.amount,
        reason: data.reason,
        note: data.note,
        due_date: data.due_date,
        is_registered: data.is_registered,
        status: 'pending'
      })
      .select()
      .single();
    return { data: result, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getSentRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getReceivedRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select('*')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function acceptRequest(id) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function rejectRequest(id) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getPendingRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getAcceptedRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
