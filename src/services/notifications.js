import { supabase } from '../supabase/client.js';

function mapNotification(row) {
  return { id: row.id, userId: row.user_id, type: row.type, title: row.title, message: row.message, date: row.created_at, read: row.read };
}

export async function listNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapNotification);
}

/** For notifying the current user themselves (RLS allows user_id = auth.uid()). */
export async function addNotification(userId, type, title, message) {
  const { data, error } = await supabase.from('notifications').insert({ user_id: userId, type, title, message }).select().single();
  if (error) throw error;
  return mapNotification(data);
}

/** For notifying a *different* user (e.g. the caregiver on the other side of a connection) — see notify_user() in the migration. */
export async function notifyOtherUser(userId, type, title, message) {
  const { error } = await supabase.rpc('notify_user', { p_user_id: userId, p_type: type, p_title: title, p_message: message });
  if (error) throw error;
}

export async function markRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

export async function deleteNotification(id) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}
