import { supabase } from '../supabase/client.js';

/**
 * Thin wrapper around Supabase Auth. Every function here mirrors what
 * src/main.js's handleAuthSubmit() / doLogout() / password-reset flow
 * already do for local demo mode — see app-init.js for how these are
 * exposed to that (non-module) file.
 */

export async function signUp(email, password, { role, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName }, // read by the handle_new_user() trigger
    },
  });
  if (error) throw error;
  return data; // { user, session }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data; // { user, session }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session; // null if not logged in
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return data.subscription; // caller can call .unsubscribe() if needed
}

export async function resetPasswordForEmail(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function deleteOwnAccount() {
  // Supabase's client SDK cannot delete a user's own auth.users row (that
  // requires the service-role key, which must never reach the browser).
  // Options for a real "Delete account" button:
  //   1. Call a Supabase Edge Function you deploy yourself, which uses the
  //      service-role key *server-side* to call
  //      supabase.auth.admin.deleteUser(userId), then invoke it here via
  //      supabase.functions.invoke('delete-account').
  //   2. Or just sign the user out and mark their profile row
  //      (e.g. profiles.deleted_at) for a background job to clean up.
  // This project ships option 2's data cleanup (removing the app-owned
  // rows this service layer controls) and leaves the actual auth.users
  // deletion to whichever of the above you set up — see README.md.
  throw new Error(
    'Deleting the underlying auth account requires a server-side Edge Function with the service-role key. See README.md → "Deleting an account".'
  );
}
