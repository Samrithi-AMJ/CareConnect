import { supabase } from '../supabase/client.js';

function mapConsultation(row) {
  return {
    id: row.id,
    userId: row.user_id,
    providerType: row.provider_type,
    notes: row.notes || '',
    status: row.status,
    requestedDate: row.requested_date,
  };
}

export async function listConsultations(userId) {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('user_id', userId)
    .order('requested_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapConsultation);
}

export async function addConsultation(userId, consult) {
  const { data, error } = await supabase
    .from('consultations')
    .insert({
      user_id: userId,
      provider_type: consult.providerType,
      notes: consult.notes || '',
      requested_date: consult.requestedDate,
    })
    .select()
    .single();
  if (error) throw error;
  return mapConsultation(data);
}
