/**
 * Environment configuration (ES module).
 *
 * Only variables prefixed VITE_ are exposed by Vite to browser code — see
 * .env.example for the full list and where each one is meant to live.
 *
 * This file is imported only by src/supabase/client.js and src/app-init.js,
 * both loaded as <script type="module">. It is never imported by
 * src/main.js (a classic, non-module script) — see app-init.js for how the
 * two worlds are bridged.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// True once both Supabase values are present. When false, the app falls
// back to its original localStorage-backed demo mode untouched — see
// "Local demo mode vs. Supabase mode" in README.md.
export const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
