import { supabase } from '../supabase/client.js';

function mapAppointment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    hospital: row.hospital,
    date: row.appt_date,
    time: row.appt_time,
    type: row.appt_type,
    location: row.location || '',
    notes: row.notes || '',
    status: row.status,
    reminder: row.reminder,
  };
}

export async function listAppointments(userId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('appt_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAppointment);
}

export async function addAppointment(userId, appt) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      provider: appt.provider,
      hospital: appt.hospital,
      appt_date: appt.date,
      appt_time: appt.time,
      appt_type: appt.type,
      location: appt.location || '',
      notes: appt.notes || '',
      reminder: !!appt.reminder,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function updateAppointment(id, appt) {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      provider: appt.provider,
      hospital: appt.hospital,
      appt_date: appt.date,
      appt_time: appt.time,
      appt_type: appt.type,
      location: appt.location || '',
      notes: appt.notes || '',
      reminder: !!appt.reminder,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function setAppointmentStatus(id, status) {
  const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return mapAppointment(data);
}
