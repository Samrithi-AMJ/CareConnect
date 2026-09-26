import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from '../config.js';

/**
 * Single shared Supabase client for the whole app, or `null` when
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set — in that case the
 * app runs in local demo mode (localStorage) instead. Every service module
 * in src/services/ assumes `supabase` is non-null; they are only called
 * once app-init.js has confirmed IS_SUPABASE_CONFIGURED is true.
 */
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
