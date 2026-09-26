# CareConnect

**Connecting Care Beyond the Hospital** — a multilingual, accessibility-first digital healthcare platform for patients, families and caregivers.

This is a standalone project you own end to end: source code, GitHub repository, database, authentication, storage, environment variables, deployment and domain. It does not depend on Claude, Claude Artifacts, or any Claude-hosted runtime, storage, or API — and if you stop using Claude entirely, CareConnect keeps working.

---

## What's in this project

- **UI, design, pages, navigation and features are unchanged**: landing page, patient + caregiver auth and onboarding, patient dashboard, medicines, appointments, post-discharge care, health records, healthcare-service discovery, remote consultation requests, caregiver invitations and permissions, a Consent & Privacy Centre, notifications, a voice assistant, emergency support, profile and settings — plus 6-language support (English, Tamil, Hindi, Telugu, Kannada, Malayalam) and accessibility controls (text size, contrast, reduced motion).
- **Two data modes, chosen automatically:**
  - **Local demo mode** (default, zero setup): data lives in your browser's `localStorage`, seeded with demo patient/caregiver accounts. This is exactly how the project worked before.
  - **Supabase mode** (once you add your own project's URL/key to `.env`): every page reads and writes through a real PostgreSQL database, with Supabase Auth for accounts and Supabase Storage for uploaded health records — all behind Row Level Security you control.
- **No framework** — plain HTML, CSS and JavaScript, run through [Vite](https://vitejs.dev) as a dev server/bundler, plus the official `@supabase/supabase-js` client.

```text
CareConnect/
├── index.html                     # App shell — loads app-init.js then main.js
├── src/
│   ├── style.css                   # All styling (design tokens, layout, components)
│   ├── main.js                     # All UI/pages + the in-memory "DB" the UI reads from
│   ├── app-init.js                 # Bridges the Supabase client/services into main.js (see below)
│   ├── config.js                   # Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
│   ├── supabase/
│   │   └── client.js                # The shared Supabase client (null in local mode)
│   └── services/                   # One module per domain — the only files that talk to Supabase
│       ├── auth.js
│       ├── profiles.js              # profile + accessibility_preferences + user_settings
│       ├── medicines.js
│       ├── appointments.js
│       ├── postDischarge.js
│       ├── records.js               # health_records table + Storage upload/signed URLs
│       ├── healthcare.js            # healthcare_services (read-only reference data)
│       ├── consultations.js
│       ├── caregivers.js            # caregiver_connections + caregiver_permissions + consents
│       ├── notifications.js
│       └── emergencyContacts.js
├── supabase/
│   └── migrations/
│       └── 0001_init.sql           # Full schema, RLS policies, storage bucket, triggers
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
└── README.md
```

### How the two modes fit together (and why `main.js` didn't need a rewrite)

`main.js` is loaded as a **plain, non-module `<script>`** on purpose: it renders every page by building HTML strings with `onclick="someFunction()"` attributes, which only works if `someFunction` is a global (`window.someFunction`) — exactly what a classic script's top-level `function` declarations become. Rewriting it as ES modules would mean touching every one of those handlers, which this project deliberately avoids.

But talking to Supabase needs `import`/`export` (for `@supabase/supabase-js` and the service files), which requires an ES module. `src/app-init.js` is that module: it's loaded with `type="module"`, imports the Supabase client and every `src/services/*.js` file, and attaches them to `window.CareConnectServices` (plus `window.BACKEND_MODE`, `'supabase'` or `'local'`). `main.js` then just checks `window.BACKEND_MODE` at each read/write point and calls `window.CareConnectServices.xxx.yyy(...)` when it's `'supabase'`, or its original localStorage logic otherwise. This works regardless of which `<script>` tag comes first in `index.html`, because `type="module"` scripts are always deferred until after the page parses, and `main.js` only touches `window.CareConnectServices` inside its own `DOMContentLoaded` handler (`bootApp()`), never at its own top level.

The upshot: every `render*()` function that *reads* data is completely unchanged — it still just reads `DB.medications`, `DB.appointments`, etc., the same in-memory object as before. Only the ~25 places that *write* data (an "Add medicine" submit handler, "Mark as taken", "Revoke access", ...) branch on the mode.

---

## 1. Install

Requires [Node.js](https://nodejs.org) 18 or later.

```bash
npm install
```

## 2. Run locally (local demo mode — no setup needed)

```bash
npm run dev
```

Opens at `http://localhost:5173`. With no `.env` file, the app runs exactly as before: localStorage-backed, seeded with demo data.

- **Patient** — `kamalam@example.com` / `demo1234`
- **Caregiver** — `priya@example.com` / `demo1234` (already connected, with some permissions shared and some withheld, so you can see the Consent & Privacy Centre in action)

To reset local demo data, clear `localStorage` for the site (dev tools → Application → Local Storage → delete `careconnect_db_v1` and `careconnect_session_v1`).

## 3. Connect your own Supabase project

### 3.1 Create the project

Sign up / log in at [supabase.com](https://supabase.com) and create a new project. Note its **Project URL** and **anon/public key** (Project Settings → API) — you'll need both.

### 3.2 Run the SQL schema

Open your project's **SQL Editor** and run the entire contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) once. It's also written for the [Supabase CLI](https://supabase.com/docs/guides/cli) if you prefer:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This one file creates:
- **17 tables**: `profiles`, `accessibility_preferences`, `user_settings`, `medications`, `medication_logs`, `appointments`, `post_discharge_plans`, `post_discharge_tasks`, `health_records`, `healthcare_services`, `consultations`, `caregiver_connections`, `caregiver_permissions`, `consents`, `notifications`, `emergency_contacts`, `audit_logs` — with primary keys, foreign keys, check constraints, indexes and timestamps.
- **Row Level Security** on every table (see [3.5](#35-how-row-level-security-enforces-caregiver-permissions) below).
- A **storage bucket** (`health-records`, private) with folder-per-user access policies.
- A **trigger** that automatically creates a `profiles` row (+ default settings) whenever someone signs up through Supabase Auth.
- A handful of **helper functions** (`has_caregiver_access`, `find_caregiver_by_email`, `notify_user`) that the service layer calls via RPC.
- A few rows of **demo `healthcare_services` reference data** (hospitals/clinics/pharmacies) so the Healthcare Near Me page has something to show — safe to edit or delete from the Table Editor.

### 3.3 Configure authentication

The app uses Supabase's built-in **email/password** auth as-is — no extra dashboard configuration is required to get started. Two things worth knowing:

- **Email confirmation**: by default, new Supabase projects require confirming a signup email before the session becomes active. If a person registers and nothing seems to happen, check Authentication → Settings — either point **Site URL** / **Redirect URLs** at your dev/prod URL so the confirmation link works, or turn confirmation off for faster local testing (Authentication → Providers → Email → "Confirm email").
- **Password reset**: `handleForgotPassword()` calls `supabase.auth.resetPasswordForEmail()`, which sends Supabase's built-in reset email using your project's configured **Site URL** as the redirect — set that under Authentication → URL Configuration.

### 3.4 Configure storage

Already done by the migration (the `health-records` bucket + its policies). Nothing further to do unless you want to change the bucket name — if you do, update `BUCKET` in `src/services/records.js` and the bucket references in the migration to match.

### 3.5 How Row Level Security enforces caregiver permissions

This is the part of section 7/8 of the spec worth explaining, not just linking to: **the frontend never decides who can see what — Postgres does.**

- Every patient-owned table has a policy like `using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'medicines'))` for `SELECT`, and `using (user_id = auth.uid())` for `INSERT`/`UPDATE`/`DELETE` — so a caregiver can never write to a patient's data, only read what's explicitly shared, and a patient always owns their own.
- `has_caregiver_access(patient_id, permission_key)` is one function, reused by every table's policy, that checks: is there an **accepted** row in `caregiver_connections` linking this caregiver to this patient, **and** is the matching flag in `caregiver_permissions` (`appointments`/`medicines`/`post_discharge`/`health_records`/`notifications`) true? If either is false, the query returns zero rows — not an error, just nothing, exactly like the existing UI's "Not Shared" badges expect.
- `caregiver_permissions` itself can only be **updated** by the patient side of the connection (checked via a subquery on `caregiver_connections.patient_id = auth.uid()`) — a caregiver can `SELECT` it (to show their read-only Permission Centre) but never write to it.
- Every change to `caregiver_permissions` is logged to `consents` (who/what/when) and, via a database trigger (not the frontend — so it can't be bypassed), to `audit_logs`.
- Uploaded health record files sit in a **private** Storage bucket with the same rule applied to file paths (`{user_id}/{filename}`): you can access a file if it's yours, or if `has_caregiver_access(that folder's user_id, 'health_records')` is true.

None of this is duplicated in the frontend for looks — if you called the Supabase API directly with someone else's session and no permission granted, you'd get the same empty result the UI shows.

### 3.6 Create your `.env`

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart `npm run dev` after creating/editing `.env` (Vite only reads it at startup). The app is now in Supabase mode — `window.BACKEND_MODE` becomes `'supabase'`, and the console logs confirm which mode is active on load.

Never put a **service-role key**, database password, or any other secret in `.env` — see the comments in `.env.example` and "Deleting an account" below for the one place this project currently needs one (server-side only).

---

## 4. Build

```bash
npm run build
```

Outputs a static site to `dist/`. Preview it locally with:

```bash
npm run preview
```

Whatever's in your `.env` at build time (or your host's environment variables — see Deploy below) is baked into that build, the same as any Vite app.

---

## 5. Push to your own GitHub repository

```bash
git init
git add .
git commit -m "Initial commit: CareConnect with Supabase backend"
git branch -M main
git remote add origin https://github.com/<your-username>/CareConnect.git
git push -u origin main
```

(Create the empty repository at `github.com/<your-username>/CareConnect` first, without a README, since this project already has one.) `.env` is already git-ignored — only `.env.example` gets committed.

---

## 6. Deploy

### Frontend (Vercel, Netlify, or any static host)

This is a static site (`npm run build` → `dist/`), so it works anywhere. Vercel/Netlify example:

1. Import the GitHub repo.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the project's Environment Variables settings (same values as your `.env`).

Render, Railway and other static-site hosts follow the same pattern: build command `npm run build`, publish directory `dist`, same two environment variables.

**GitHub Pages** note: since project sites are served from a sub-path (`https://<username>.github.io/CareConnect/`), uncomment and set `base: '/CareConnect/'` in `vite.config.js` before building.

### Backend

There's nothing separate to deploy — Supabase *is* the backend (hosted Postgres, Auth, Storage), already live once you completed step 3. The only backend-shaped thing this project doesn't include is a server for deleting a user's own auth account (see below); everything else runs directly from the static frontend against your Supabase project over HTTPS, secured by Row Level Security rather than a server you have to run and patch yourself.

---

## Local demo mode vs. Supabase mode — quick reference

| | Local demo mode | Supabase mode |
|---|---|---|
| Turned on by | default (no `.env`) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` both set |
| Data storage | browser `localStorage` | your Supabase Postgres project |
| Auth | fake, in-memory, per-browser | real Supabase Auth (email/password) |
| File uploads | recorded by name only | uploaded to a private Supabase Storage bucket |
| Data survives a refresh? | yes (same browser only) | yes (any device, once logged in) |
| Multiple users can share data? | no | yes, subject to Row Level Security |
| Good for | trying the UI, demos, offline dev | the real, deployed product |

`window.BACKEND_MODE` (set once at load by `src/app-init.js`) is what every read/write branches on — see "How the two modes fit together" above.

---

## Deleting an account

Supabase's client SDK deliberately **cannot** delete a user's own `auth.users` row — that requires the service-role key, which must never reach the browser (see `.env.example`). In Supabase mode, the Settings → Account → Delete account button signs the user out and tells them plainly that full deletion needs a server-side step, rather than claiming a deletion that didn't happen.

To make that button fully work, add a [Supabase Edge Function](https://supabase.com/docs/guides/functions) deployed with your project (its own environment holds the service-role key, set via `supabase secrets set`), that calls `supabase.auth.admin.deleteUser(userId)` — then call it from `src/services/auth.js` → `deleteOwnAccount()` via `supabase.functions.invoke('delete-account')`. Deleting the `profiles` row first (or letting `on delete cascade` handle it once the auth user is gone) removes everything else this project owns, since every other table cascades from `profiles.id`.

---

## Extending the data model

- **healthcare_services** (hospitals/clinics/pharmacies) is reference data, not user-owned — the migration seeds a few demo rows, but there's no app UI for editing it. Manage it from the Supabase Table Editor, or swap `src/services/healthcare.js` for a real maps/places API.
- Every other table follows the same shape: a Postgres table in the migration, a mapping function in the matching `src/services/*.js` file (snake_case columns ↔ the camelCase shape `main.js` already expects), and a couple of call sites in `main.js` gated on `window.BACKEND_MODE`. Follow that same pattern for anything new.

---

## What "removing the Artifact dependency" involved (for context)

The original build already used only standard web platform APIs (`localStorage`, Geolocation, Web Speech) — no Claude-specific runtime. The prior conversion split the single Artifact HTML file into `index.html` / `src/style.css` / `src/main.js` and wrapped it in a normal Vite project. This round replaced the localStorage "database" with an equivalent, real Supabase backend (schema, RLS, storage, auth) behind the exact same UI, added as a parallel mode rather than a rewrite, so local demo mode still works untouched with zero configuration.
