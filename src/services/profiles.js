import { supabase } from '../supabase/client.js';

/** Maps a `profiles` row (snake_case) to the shape main.js already expects. */
function mapProfile(row) {
  if (!row) return null;
  return {
    fullName: row.full_name || '',
    age: row.age ?? '',
    gender: row.gender || '',
    phone: row.phone || '',
    location: row.location || '',
    preferredLanguage: row.preferred_language || 'en',
    emergencyContactName: row.emergency_contact_name || '',
    emergencyContactPhone: row.emergency_contact_phone || '',
    onboardingComplete: !!row.onboarding_complete,
    role: row.role,
    email: row.email,
  };
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfile(userId, fields) {
  const payload = {};
  if ('fullName' in fields) payload.full_name = fields.fullName;
  if ('age' in fields) payload.age = fields.age === '' ? null : fields.age;
  if ('gender' in fields) payload.gender = fields.gender;
  if ('phone' in fields) payload.phone = fields.phone;
  if ('location' in fields) payload.location = fields.location;
  if ('preferredLanguage' in fields) payload.preferred_language = fields.preferredLanguage;
  if ('emergencyContactName' in fields) payload.emergency_contact_name = fields.emergencyContactName;
  if ('emergencyContactPhone' in fields) payload.emergency_contact_phone = fields.emergencyContactPhone;
  if ('onboardingComplete' in fields) payload.onboarding_complete = fields.onboardingComplete;

  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
  if (error) throw error;
  return mapProfile(data);
}

function mapA11y(row) {
  if (!row) return { textSize: 'standard', contrast: 'standard', reducedMotion: false, voiceAssist: false, textToSpeech: false };
  return {
    textSize: row.text_size,
    contrast: row.contrast,
    reducedMotion: row.reduced_motion,
    voiceAssist: row.voice_assist,
    textToSpeech: row.text_to_speech,
  };
}

export async function getAccessibility(userId) {
  const { data, error } = await supabase.from('accessibility_preferences').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return mapA11y(data);
}

export async function updateAccessibility(userId, fields) {
  const payload = { user_id: userId };
  if ('textSize' in fields) payload.text_size = fields.textSize;
  if ('contrast' in fields) payload.contrast = fields.contrast;
  if ('reducedMotion' in fields) payload.reduced_motion = fields.reducedMotion;
  if ('voiceAssist' in fields) payload.voice_assist = fields.voiceAssist;
  if ('textToSpeech' in fields) payload.text_to_speech = fields.textToSpeech;

  const { data, error } = await supabase
    .from('accessibility_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return mapA11y(data);
}

export async function getSettings(userId) {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data
    ? {
        language: data.language,
        notif_medicine: data.notif_medicine,
        notif_appointment: data.notif_appointment,
        notif_followup: data.notif_followup,
        notif_caregiver: data.notif_caregiver,
      }
    : { language: 'en', notif_medicine: true, notif_appointment: true, notif_followup: true, notif_caregiver: true };
}

export async function updateSettings(userId, fields) {
  const payload = { user_id: userId, ...fields };
  const { data, error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return {
    language: data.language,
    notif_medicine: data.notif_medicine,
    notif_appointment: data.notif_appointment,
    notif_followup: data.notif_followup,
    notif_caregiver: data.notif_caregiver,
  };
}
