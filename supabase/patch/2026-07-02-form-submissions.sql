-- Form submissions (contact + newsletter).
--
-- Paste into the Supabase SQL editor. Safe to run more than once.
--
-- Public form submissions follow the same trust boundary as orders/payments:
-- writes happen ONLY through the trusted functions app using the secret key
-- (see docs/decisions.md — "Operational writes happen only in trusted
-- functions"). The browser never inserts here directly, so there is NO anon
-- insert policy — the service-role key bypasses RLS for the insert, and RLS is
-- default-deny for everyone else. Admins read submissions in the admin app.
--
-- One table per form, named form_<name>. The stable identity/metadata lives in
-- real columns (for fast list + search in admin); the variable, per-form fields
-- live in the "data" jsonb bag so adding a new field never needs a migration.

create extension if not exists pgcrypto;

-- Contact form ------------------------------------------------------------
create table if not exists public.form_contact (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  "data" jsonb not null default '{}'::jsonb,
  "sourceUrl" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now()
);

create index if not exists form_contact_created_idx on public.form_contact ("createdAt" desc);

alter table public.form_contact enable row level security;
drop policy if exists "Admin reads contact submissions" on public.form_contact;
create policy "Admin reads contact submissions" on public.form_contact
  for select to authenticated using (public.is_admin());

-- Newsletter signups ------------------------------------------------------
create table if not exists public.form_newsletter (
  id uuid primary key default gen_random_uuid(),
  email text,
  "data" jsonb not null default '{}'::jsonb,
  "sourceUrl" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now()
);

create index if not exists form_newsletter_created_idx on public.form_newsletter ("createdAt" desc);

alter table public.form_newsletter enable row level security;
drop policy if exists "Admin reads newsletter submissions" on public.form_newsletter;
create policy "Admin reads newsletter submissions" on public.form_newsletter
  for select to authenticated using (public.is_admin());
