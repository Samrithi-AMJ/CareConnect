-- =========================================================================
-- CareConnect — Supabase schema, Row Level Security, and Storage policies
-- =========================================================================
-- Run this once against your own Supabase project (SQL Editor, or via the
-- Supabase CLI: `supabase db push`). See README.md for the exact steps.
--
-- Design notes:
--   * Every patient-owned table carries a `user_id` referencing profiles(id)
--     (== auth.users.id). RLS restricts owners to their own rows.
--   * A caregiver only gets SELECT access to a patient's rows when (a) an
--     accepted caregiver_connections row links them to that patient, AND
--     (b) the matching caregiver_permissions flag is true. This mirrors the
--     Consent & Privacy Centre already in the CareConnect UI exactly —
--     the frontend never has to (and cannot) bypass this.
--   * `public.has_caregiver_access(user_id, perm_key)` centralizes that
--     check so it isn't duplicated (and doesn't drift) across policies.
--   * `profiles.email` is duplicated from auth.users so the app can look up
--     a caregiver by email during an invite without needing admin access
--     to auth.users. It's kept in sync only at signup — see the note above
--     handle_new_user() below.
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- 1. profiles (1:1 with auth.users)
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'patient' check (role in ('patient','caregiver')),
  email text,
  full_name text default '',
  age int,
  gender text,
  phone text,
  location text,
  preferred_language text not null default 'en',
  emergency_contact_name text,
  emergency_contact_phone text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessibility_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  text_size text not null default 'standard' check (text_size in ('standard','large','xl')),
  contrast text not null default 'standard' check (contrast in ('standard','high')),
  reduced_motion boolean not null default false,
  voice_assist boolean not null default false,
  text_to_speech boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text not null default 'en',
  notif_medicine boolean not null default true,
  notif_appointment boolean not null default true,
  notif_followup boolean not null default true,
  notif_caregiver boolean not null default true,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 2. Medicines
-- -------------------------------------------------------------------------
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  times text[] not null default '{}',
  start_date date,
  end_date date,
  instructions text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists medications_user_id_idx on public.medications(user_id);

create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  log_time text not null,
  status text not null check (status in ('taken','missed')),
  created_at timestamptz not null default now(),
  unique (medication_id, log_date, log_time)
);
create index if not exists medication_logs_user_id_idx on public.medication_logs(user_id);
create index if not exists medication_logs_medication_id_idx on public.medication_logs(medication_id);

-- -------------------------------------------------------------------------
-- 3. Appointments
-- -------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  hospital text not null,
  appt_date date not null,
  appt_time text not null,
  appt_type text not null,
  location text default '',
  notes text default '',
  status text not null default 'upcoming' check (status in ('upcoming','past','cancelled')),
  reminder boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists appointments_user_id_idx on public.appointments(user_id);

-- -------------------------------------------------------------------------
-- 4. Post-discharge care
-- -------------------------------------------------------------------------
create table if not exists public.post_discharge_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  hospital text not null,
  discharge_date date not null,
  provider text default '',
  follow_up_date date,
  instructions text default '',
  medication_schedule text default '',
  test_schedule text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create index if not exists post_discharge_plans_user_id_idx on public.post_discharge_plans(user_id);

create table if not exists public.post_discharge_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.post_discharge_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  stage text not null check (stage in ('discharge','medication','recovery','followup','diagnostic','review')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists post_discharge_tasks_plan_id_idx on public.post_discharge_tasks(plan_id);
create index if not exists post_discharge_tasks_user_id_idx on public.post_discharge_tasks(user_id);

-- -------------------------------------------------------------------------
-- 5. Health records (metadata; files live in Supabase Storage, see below)
-- -------------------------------------------------------------------------
create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Prescription','Lab Report','Discharge Summary','Medical Report','Other')),
  record_date date,
  upload_date date not null default current_date,
  storage_path text, -- path inside the 'health-records' storage bucket, e.g. "<user_id>/<uuid>-report.pdf"
  created_at timestamptz not null default now()
);
create index if not exists health_records_user_id_idx on public.health_records(user_id);

-- -------------------------------------------------------------------------
-- 6. Healthcare service directory (shared reference data, not per-user)
-- -------------------------------------------------------------------------
create table if not exists public.healthcare_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Hospital','Clinic','Pharmacy','Diagnostic Centre','Emergency Facility')),
  address text,
  distance text, -- kept as display text for parity with the current UI; add lat/lng below for a real map integration
  phone text,
  is_open boolean not null default true,
  lat numeric,
  lng numeric,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 7. Remote consultations
-- -------------------------------------------------------------------------
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_type text not null,
  notes text default '',
  status text not null default 'Requested' check (status in ('Requested','Confirmed','Completed')),
  requested_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists consultations_user_id_idx on public.consultations(user_id);

-- -------------------------------------------------------------------------
-- 8. Caregiver connections & permissions
-- -------------------------------------------------------------------------
create table if not exists public.caregiver_connections (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid references public.profiles(id) on delete cascade, -- null until an invited caregiver has an account
  invited_email text,
  relationship text default '',
  status text not null default 'pending' check (status in ('pending','accepted')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint caregiver_or_email check (caregiver_id is not null or invited_email is not null)
);
create index if not exists caregiver_connections_patient_id_idx on public.caregiver_connections(patient_id);
create index if not exists caregiver_connections_caregiver_id_idx on public.caregiver_connections(caregiver_id);

create table if not exists public.caregiver_permissions (
  connection_id uuid primary key references public.caregiver_connections(id) on delete cascade,
  appointments boolean not null default false,
  medicines boolean not null default false,
  post_discharge boolean not null default false,
  health_records boolean not null default false,
  notifications boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Consent change history (answers "when was access granted/changed?" in the
-- Privacy Centre). One append-only row per toggle.
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.caregiver_connections(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid references public.profiles(id) on delete cascade,
  permission_key text not null check (permission_key in ('appointments','medicines','post_discharge','health_records','notifications','all')),
  granted boolean not null,
  changed_at timestamptz not null default now()
);
create index if not exists consents_patient_id_idx on public.consents(patient_id);
create index if not exists consents_connection_id_idx on public.consents(connection_id);

-- -------------------------------------------------------------------------
-- 9. Notifications & emergency contacts
-- -------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('medicine','appointment','followup','record','caregiver','system')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text default '',
  created_at timestamptz not null default now()
);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts(user_id);

-- -------------------------------------------------------------------------
-- 10. Audit log (security-relevant events, written by triggers below —
--     not by the frontend directly, so it can't be spoofed or skipped)
-- -------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);

-- =========================================================================
-- Helper functions
-- =========================================================================

-- Keeps updated_at fresh on UPDATE without every service call setting it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.accessibility_preferences;
create trigger set_updated_at before update on public.accessibility_preferences
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at before update on public.user_settings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.caregiver_permissions;
create trigger set_updated_at before update on public.caregiver_permissions
  for each row execute procedure public.set_updated_at();

-- Creates a profile (+ default settings rows) automatically whenever someone
-- signs up through Supabase Auth. `role` and `full_name` are read from the
-- signup call's options.data (see src/services/auth.js: signUp()).
-- security definer: needs to write to public.profiles etc. from a trigger
-- that fires as the Postgres role executing the INSERT into auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.accessibility_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Central "does the currently-authenticated caregiver have this permission
-- for this patient?" check, reused by every caregiver-read RLS policy below.
-- security definer + fixed search_path so it can read caregiver_connections
-- / caregiver_permissions regardless of the caller's own row visibility.
create or replace function public.has_caregiver_access(target_user_id uuid, perm_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.caregiver_connections cc
    join public.caregiver_permissions cp on cp.connection_id = cc.id
    where cc.patient_id = target_user_id
      and cc.caregiver_id = auth.uid()
      and cc.status = 'accepted'
      and case perm_key
        when 'appointments'    then cp.appointments
        when 'medicines'       then cp.medicines
        when 'post_discharge'  then cp.post_discharge
        when 'health_records'  then cp.health_records
        when 'notifications'   then cp.notifications
        else false
      end
  );
$$;

-- Lets a patient look up a caregiver's account by email during an invite,
-- without granting broad read access to the profiles table (see the
-- profiles RLS policies below, which do NOT allow that lookup directly).
create or replace function public.find_caregiver_by_email(p_email text)
returns table(id uuid, full_name text)
language sql
security definer
set search_path = public
stable
as $$
  select id, full_name from public.profiles where email = p_email and role = 'caregiver';
$$;

grant execute on function public.has_caregiver_access(uuid, text) to authenticated;
grant execute on function public.find_caregiver_by_email(text) to authenticated;

-- Auto-logs every caregiver_permissions change and health_record deletion.
-- Runs as the function owner so it can't be disabled or skipped by the
-- frontend — this is the "don't rely only on frontend checks" requirement
-- applied to auditing specifically.
create or replace function public.log_permission_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, target_table, target_id, metadata)
  values (
    auth.uid(),
    'caregiver_permission_updated',
    'caregiver_permissions',
    new.connection_id,
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists log_permission_change on public.caregiver_permissions;
create trigger log_permission_change after update on public.caregiver_permissions
  for each row execute procedure public.log_permission_change();

create or replace function public.log_health_record_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'health_record_deleted', 'health_records', old.id, to_jsonb(old));
  return old;
end;
$$;

drop trigger if exists log_health_record_delete on public.health_records;
create trigger log_health_record_delete before delete on public.health_records
  for each row execute procedure public.log_health_record_delete();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.accessibility_preferences enable row level security;
alter table public.user_settings enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.post_discharge_plans enable row level security;
alter table public.post_discharge_tasks enable row level security;
alter table public.health_records enable row level security;
alter table public.healthcare_services enable row level security;
alter table public.consultations enable row level security;
alter table public.caregiver_connections enable row level security;
alter table public.caregiver_permissions enable row level security;
alter table public.consents enable row level security;
alter table public.notifications enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.audit_logs enable row level security;

-- ---- profiles ----
-- Either side of an *accepted* connection can see the other's basic profile
-- (name, etc.) — this is just "who is this person", not one of the five
-- granular categories (appointments/medicines/post-discharge/records/
-- notifications) gated by has_caregiver_access(). Those still apply to the
-- actual clinical data in their own tables' policies below.
drop policy if exists "profiles_select_own_or_connected" on public.profiles;
create policy "profiles_select_own_or_connected" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.caregiver_connections cc
      where cc.status = 'accepted'
        and ((cc.patient_id = profiles.id and cc.caregiver_id = auth.uid())
          or (cc.caregiver_id = profiles.id and cc.patient_id = auth.uid()))
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ---- accessibility_preferences / user_settings (owner only, no sharing) ----
drop policy if exists "a11y_owner_all" on public.accessibility_preferences;
create policy "a11y_owner_all" on public.accessibility_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "settings_owner_all" on public.user_settings;
create policy "settings_owner_all" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- medications ----
drop policy if exists "medications_select" on public.medications;
create policy "medications_select" on public.medications
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'medicines'));

drop policy if exists "medications_write" on public.medications;
create policy "medications_write" on public.medications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- medication_logs ----
drop policy if exists "medication_logs_select" on public.medication_logs;
create policy "medication_logs_select" on public.medication_logs
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'medicines'));

drop policy if exists "medication_logs_write" on public.medication_logs;
create policy "medication_logs_write" on public.medication_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- appointments ----
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'appointments'));

drop policy if exists "appointments_write" on public.appointments;
create policy "appointments_write" on public.appointments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- post_discharge_plans / tasks ----
drop policy if exists "pd_plans_select" on public.post_discharge_plans;
create policy "pd_plans_select" on public.post_discharge_plans
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'post_discharge'));

drop policy if exists "pd_plans_write" on public.post_discharge_plans;
create policy "pd_plans_write" on public.post_discharge_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "pd_tasks_select" on public.post_discharge_tasks;
create policy "pd_tasks_select" on public.post_discharge_tasks
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'post_discharge'));

drop policy if exists "pd_tasks_write" on public.post_discharge_tasks;
create policy "pd_tasks_write" on public.post_discharge_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- health_records ----
drop policy if exists "health_records_select" on public.health_records;
create policy "health_records_select" on public.health_records
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'health_records'));

drop policy if exists "health_records_write" on public.health_records;
create policy "health_records_write" on public.health_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- healthcare_services (read-only shared reference data) ----
drop policy if exists "healthcare_services_select" on public.healthcare_services;
create policy "healthcare_services_select" on public.healthcare_services
  for select using (auth.role() = 'authenticated');
-- No insert/update/delete policy is created here on purpose: this table is
-- reference data you maintain yourself (Supabase dashboard, an admin
-- script, or a service-role job) — not something the app writes to.

-- ---- consultations ----
drop policy if exists "consultations_select" on public.consultations;
create policy "consultations_select" on public.consultations
  for select using (user_id = auth.uid());

drop policy if exists "consultations_write" on public.consultations;
create policy "consultations_write" on public.consultations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- caregiver_connections ----
drop policy if exists "connections_select" on public.caregiver_connections;
create policy "connections_select" on public.caregiver_connections
  for select using (patient_id = auth.uid() or caregiver_id = auth.uid());

drop policy if exists "connections_insert" on public.caregiver_connections;
create policy "connections_insert" on public.caregiver_connections
  for insert with check (patient_id = auth.uid());

drop policy if exists "connections_update" on public.caregiver_connections;
create policy "connections_update" on public.caregiver_connections
  for update using (patient_id = auth.uid()) with check (patient_id = auth.uid());
-- Only the patient can update a connection (e.g. accept on the caregiver's
-- behalf isn't modeled here — see README for the invite flow). A caregiver
-- can only ever SELECT their own connections, never write to them.

drop policy if exists "connections_delete" on public.caregiver_connections;
create policy "connections_delete" on public.caregiver_connections
  for delete using (patient_id = auth.uid());

-- ---- caregiver_permissions ----
drop policy if exists "permissions_select" on public.caregiver_permissions;
create policy "permissions_select" on public.caregiver_permissions
  for select using (
    exists (
      select 1 from public.caregiver_connections cc
      where cc.id = caregiver_permissions.connection_id
        and (cc.patient_id = auth.uid() or cc.caregiver_id = auth.uid())
    )
  );

drop policy if exists "permissions_write" on public.caregiver_permissions;
create policy "permissions_write" on public.caregiver_permissions
  for all using (
    exists (
      select 1 from public.caregiver_connections cc
      where cc.id = caregiver_permissions.connection_id and cc.patient_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.caregiver_connections cc
      where cc.id = caregiver_permissions.connection_id and cc.patient_id = auth.uid()
    )
  );
-- Only the patient side of the connection can change permissions — this is
-- the "do not rely only on frontend checks" requirement enforced at the
-- database level, not just by hiding the toggle in the caregiver's UI.

-- ---- consents (append-only audit of permission changes) ----
drop policy if exists "consents_select" on public.consents;
create policy "consents_select" on public.consents
  for select using (patient_id = auth.uid() or caregiver_id = auth.uid());

drop policy if exists "consents_insert" on public.consents;
create policy "consents_insert" on public.consents
  for insert with check (patient_id = auth.uid());

-- ---- notifications ----
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid() or public.has_caregiver_access(user_id, 'notifications'));

drop policy if exists "notifications_write" on public.notifications;
create policy "notifications_write" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Note: the app also inserts a notification for the *other* party in a
-- caregiver connection sometimes (e.g. "caregiver connected" is
-- created for both sides). Because notifications_write only allows
-- user_id = auth.uid(), a client can only create notifications for
-- itself — cross-user notifications are created by the
-- notify_other_party() trigger below instead of directly by the client.

-- ---- emergency_contacts ----
drop policy if exists "emergency_contacts_owner_all" on public.emergency_contacts;
create policy "emergency_contacts_owner_all" on public.emergency_contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- audit_logs (read your own actions only; nothing can update/delete) ----
drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs
  for select using (actor_id = auth.uid());
-- No insert/update/delete policy: rows are written only by the
-- security-definer trigger functions above, never directly by clients.

-- =========================================================================
-- Cross-user notification helper
-- =========================================================================
-- The RLS policy above intentionally stops a client from inserting a
-- notification row for someone else's user_id. But the product does need
-- a couple of cross-user notifications (inviting a caregiver notifies the
-- caregiver; accepting/updating a connection notifies the patient). This
-- security-definer function is the one narrow, server-side exception,
-- rather than loosening the RLS policy itself.
create or replace function public.notify_user(
  p_user_id uuid, p_type text, p_title text, p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message)
  values (p_user_id, p_type, p_title, p_message);
end;
$$;

grant execute on function public.notify_user(uuid, text, text, text) to authenticated;

-- =========================================================================
-- Storage: private bucket for uploaded health records
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('health-records', 'health-records', false)
on conflict (id) do nothing;

drop policy if exists "health_records_storage_insert" on storage.objects;
create policy "health_records_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'health-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "health_records_storage_select" on storage.objects;
create policy "health_records_storage_select" on storage.objects
  for select using (
    bucket_id = 'health-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_caregiver_access((storage.foldername(name))[1]::uuid, 'health_records')
    )
  );

drop policy if exists "health_records_storage_delete" on storage.objects;
create policy "health_records_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'health-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Files must be uploaded under a path starting with the owning user's id,
-- e.g. `${userId}/${crypto.randomUUID()}-${file.name}` — see
-- src/services/records.js. Nothing else about the path is enforced by
-- these policies beyond that first folder segment.

-- =========================================================================
-- Optional: demo/reference healthcare_services rows
-- =========================================================================
-- healthcare_services has no per-user owner, so it's safe to seed a handful
-- of rows for the Healthcare Near Me page to have something to show before
-- you wire up a real maps/places API. Safe to re-run (guarded by name).
insert into public.healthcare_services (name, type, address, distance, phone, is_open)
select * from (values
  ('Erode General Hospital', 'Hospital', 'Perundurai Road, Erode', '1.2 km', '+91 424 225 1234', true),
  ('Sri Sai Diagnostics', 'Diagnostic Centre', 'Gandhi Road, Erode', '2.0 km', '+91 424 225 5678', true),
  ('Apollo Pharmacy', 'Pharmacy', 'Brough Road, Erode', '0.6 km', '+91 424 225 9012', true),
  ('Lotus Family Clinic', 'Clinic', 'RKV Road, Erode', '1.5 km', '+91 424 225 3456', false),
  ('Erode Emergency & Trauma Centre', 'Emergency Facility', 'Collector Office Road, Erode', '2.8 km', '108', true),
  ('Nandha Medical Centre', 'Hospital', 'Perundurai, Erode', '6.4 km', '+91 424 226 7788', true)
) as v(name, type, address, distance, phone, is_open)
where not exists (select 1 from public.healthcare_services where healthcare_services.name = v.name);
