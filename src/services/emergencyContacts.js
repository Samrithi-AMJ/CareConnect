import { supabase } from '../supabase/client.js';

function mapContact(row) {
  return { id: row.id, userId: row.user_id, name: row.name, phone: row.phone, relationship: row.relationship || '' };
}

export async function listEmergencyContacts(userId) {
  const { data, error } = await supabase.from('emergency_contacts').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapContact);
}

export async function addEmergencyContact(userId, contact) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({ user_id: userId, name: contact.name, phone: contact.phone, relationship: contact.relationship || '' })
    .select()
    .single();
  if (error) throw error;
  return mapContact(data);
}
