import { supabase } from '../supabase/client.js';

const BUCKET = 'health-records';

function mapRecord(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    date: row.record_date || '',
    uploadDate: row.upload_date,
    storagePath: row.storage_path || '',
  };
}

export async function listRecords(userId) {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .order('record_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecord);
}

/**
 * Uploads `file` (a browser File from an <input type="file">, may be
 * undefined if the person didn't attach one) to the private health-records
 * bucket under `${userId}/...`, then inserts the metadata row. Storage RLS
 * (see supabase/migrations/0001_init.sql) enforces that this path segment
 * must equal auth.uid() — the same value passed in here.
 */
export async function addRecord(userId, record, file) {
  let storagePath = null;
  if (file) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) throw uploadError;
  }

  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: userId,
      name: record.name,
      type: record.type,
      record_date: record.date || null,
      storage_path: storagePath,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRecord(data);
}

/** Signed URL valid for `expiresInSeconds`, for previewing or downloading a private file. */
export async function getSignedUrl(storagePath, expiresInSeconds = 300) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteRecord(id, storagePath) {
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
    // Don't block deleting the metadata row if the file was already gone.
    if (storageError) console.warn('Could not remove stored file (continuing):', storageError.message);
  }
  const { error } = await supabase.from('health_records').delete().eq('id', id);
  if (error) throw error;
}
