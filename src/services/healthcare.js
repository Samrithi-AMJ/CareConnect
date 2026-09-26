import { supabase } from '../supabase/client.js';

/**
 * Reference data (hospitals, clinics, pharmacies, etc.) — not user-owned.
 * See the note in supabase/migrations/0001_init.sql: this table is meant to
 * be maintained by you (Supabase dashboard, an admin script, or a real
 * maps/places API integration), not written to by the app.
 */
export async function listServices() {
  const { data, error } = await supabase.from('healthcare_services').select('*').order('name');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address || '',
    distance: row.distance || '',
    phone: row.phone || '',
    open: row.is_open,
    lat: row.lat,
    lng: row.lng,
  }));
}
