import { supabase } from '../supabase/client.js';

function mapMedication(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    times: row.times || [],
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    instructions: row.instructions || '',
    active: row.active,
  };
}

function mapLog(row) {
  return { id: row.id, medicationId: row.medication_id, date: row.log_date, time: row.log_time, status: row.status };
}

export async function listMedications(userId) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMedication);
}

export async function addMedication(userId, med) {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: userId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times,
      start_date: med.startDate || null,
      end_date: med.endDate || null,
      instructions: med.instructions || '',
    })
    .select()
    .single();
  if (error) throw error;
  return mapMedication(data);
}

export async function updateMedication(id, med) {
  const { data, error } = await supabase
    .from('medications')
    .update({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times,
      start_date: med.startDate || null,
      end_date: med.endDate || null,
      instructions: med.instructions || '',
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMedication(data);
}

export async function deactivateMedication(id) {
  const { error } = await supabase.from('medications').update({ active: false }).eq('id', id);
  if (error) throw error;
}

export async function listMedicationLogs(userId) {
  const { data, error } = await supabase.from('medication_logs').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapLog);
}

/** Insert-or-update the log for one (medication, date, time) triple. */
export async function upsertMedicationLog(medicationId, userId, date, time, status) {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      { medication_id: medicationId, user_id: userId, log_date: date, log_time: time, status },
      { onConflict: 'medication_id,log_date,log_time' }
    )
    .select()
    .single();
  if (error) throw error;
  return mapLog(data);
}
