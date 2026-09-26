import { supabase } from '../supabase/client.js';

const PERM_DB_KEYS = { appointments: 'appointments', medicines: 'medicines', postDischarge: 'post_discharge', healthRecords: 'health_records', notifications: 'notifications' };

function mapConnection(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    caregiverId: row.caregiver_id,
    invitedEmail: row.invited_email,
    relationship: row.relationship || '',
    status: row.status,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
  };
}
function mapPermissions(row) {
  return {
    appointments: !!row?.appointments,
    medicines: !!row?.medicines,
    postDischarge: !!row?.post_discharge,
    healthRecords: !!row?.health_records,
    notifications: !!row?.notifications,
  };
}

export async function listConnectionsForPatient(patientId) {
  const { data, error } = await supabase.from('caregiver_connections').select('*').eq('patient_id', patientId);
  if (error) throw error;
  return (data || []).map(mapConnection);
}

export async function listConnectionsForCaregiver(caregiverId) {
  const { data, error } = await supabase.from('caregiver_connections').select('*').eq('caregiver_id', caregiverId).eq('status', 'accepted');
  if (error) throw error;
  return (data || []).map(mapConnection);
}

/** Looks up a caregiver account by email via a security-definer RPC (see migration) — patients can't query profiles directly by email otherwise. */
export async function findCaregiverByEmail(email) {
  const { data, error } = await supabase.rpc('find_caregiver_by_email', { p_email: email });
  if (error) throw error;
  return data && data.length ? { id: data[0].id, fullName: data[0].full_name } : null;
}

export async function getPermissions(connectionId) {
  const { data, error } = await supabase.from('caregiver_permissions').select('*').eq('connection_id', connectionId).maybeSingle();
  if (error) throw error;
  return mapPermissions(data);
}

/**
 * Invites a caregiver by email. If an account with that email + role
 * already exists, the connection is created as 'accepted' immediately
 * (matching the existing demo UI's behavior); otherwise it's created
 * 'pending' with just the email on file, to be linked once that person
 * registers (see README.md's caregiver-invite note for the manual linking
 * step this project doesn't fully automate).
 */
export async function inviteCaregiver(patientId, email, relationship) {
  const existing = await findCaregiverByEmail(email);

  const { data: conn, error } = await supabase
    .from('caregiver_connections')
    .insert({
      patient_id: patientId,
      caregiver_id: existing ? existing.id : null,
      invited_email: email,
      relationship,
      status: existing ? 'accepted' : 'pending',
      accepted_at: existing ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: perms, error: permErr } = await supabase
    .from('caregiver_permissions')
    .insert({ connection_id: conn.id })
    .select()
    .single();
  if (permErr) throw permErr;

  if (existing) {
    await supabase.rpc('notify_user', {
      p_user_id: existing.id,
      p_type: 'caregiver',
      p_title: 'New patient connection',
      p_message: 'You have been invited as a caregiver.',
    });
  }

  return { connection: mapConnection(conn), permissions: mapPermissions(perms) };
}

export async function removeCaregiver(connectionId) {
  const { error } = await supabase.from('caregiver_connections').delete().eq('id', connectionId);
  if (error) throw error;
}

/** Updates one permission flag and appends a row to the consents audit trail. */
export async function updatePermission(connectionId, patientId, caregiverId, key, value) {
  const dbKey = PERM_DB_KEYS[key];
  const { data, error } = await supabase
    .from('caregiver_permissions')
    .update({ [dbKey]: value })
    .eq('connection_id', connectionId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('consents').insert({
    connection_id: connectionId,
    patient_id: patientId,
    caregiver_id: caregiverId,
    permission_key: dbKey,
    granted: value,
  });

  return mapPermissions(data);
}

export async function revokeAllPermissions(connectionId, patientId, caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_permissions')
    .update({ appointments: false, medicines: false, post_discharge: false, health_records: false, notifications: false })
    .eq('connection_id', connectionId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('consents').insert({
    connection_id: connectionId,
    patient_id: patientId,
    caregiver_id: caregiverId,
    permission_key: 'all',
    granted: false,
  });

  return mapPermissions(data);
}
