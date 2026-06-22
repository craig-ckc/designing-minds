-- Designing Minds — Supabase schema (wall version).
--
-- Mirrors docs/content-map.md: collections (products, subjects, faqs,
-- testimonials), controlled fields (carried in app config for now), and
-- operational records (customers, orders, payments). Column names match the
-- @designing-minds/cms TypeScript types so the Supabase provider can cast
-- `select('*')` rows directly.
--
-- Pages are intentionally NOT tables — static pages are owned by the website.

-- =========================================================================
-- Collections
-- =========================================================================

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  title text not null,
  "shortDescription" text not null default '',
  "fullDescription" text not null default '',
  "priceZar" integer not null default 0,
  grade text not null,
  term text not null,
  year text not null,
  "productKind" text not null check ("productKind" in ('Individual Resource', 'Bundle', 'Access Plan')),
  "resourceFormat" text not null,
  subjects text[] not null default '{}',
  marks integer,
  "previewFiles" jsonb not null default '[]',
  "purchasedFiles" jsonb not null default '[]',
  featured boolean not null default false,
  published boolean not null default false,
  "sortOrder" integer not null default 0,
  seo jsonb not null default '{}',
  faqs text[] not null default '{}',
  "updatedAt" timestamptz not null default now(),
  -- Bundle-only
  "bundleScope" text check ("bundleScope" in ('Term', 'Full Year')),
  -- Access Plan-only
  "accessPeriod" text check ("accessPeriod" in ('Term', 'Year')),
  "includedGrades" text[],
  "deliveryRules" text,
  "renewalNotes" text,
  -- Shared by Bundle + Access Plan
  "includedProductSlugs" text[],
  "includedSubjects" text[],
  "includedTerms" text[]
);

create table if not exists public.subjects (
  id text primary key,
  slug text not null unique,
  name text not null,
  "shortLabel" text not null default '',
  description text not null default '',
  "sortOrder" integer not null default 0,
  visible boolean not null default true,
  faqs text[] not null default '{}',
  accent text,
  seo jsonb
);

create table if not exists public.faqs (
  id text primary key,
  question text not null,
  answer text not null default '',
  category text not null default 'General',
  "sortOrder" integer not null default 0,
  published boolean not null default true
);

create table if not exists public.testimonials (
  id text primary key,
  "customerName" text not null,
  quote text not null,
  context text not null default '',
  "learnerGrade" text,
  "sourceDate" date,
  featured boolean not null default false,
  "sortOrder" integer not null default 0,
  published boolean not null default true
);

-- =========================================================================
-- Operational records
-- =========================================================================

create table if not exists public.customers (
  id text primary key,
  name text not null,
  email text not null unique,
  "createdAt" timestamptz not null default now(),
  "orderIds" text[] not null default '{}'
);

create table if not exists public.orders (
  id text primary key,
  reference text not null unique,
  "customerId" text not null references public.customers (id) on delete cascade,
  "customerName" text not null,
  "customerEmail" text not null,
  status text not null check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'failed')),
  items jsonb not null default '[]',
  "totalZar" integer not null default 0,
  "paymentId" text,
  "placedAt" timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  "orderId" text not null references public.orders (id) on delete cascade,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  provider text not null,
  reference text not null,
  "amountZar" integer not null default 0,
  "createdAt" timestamptz not null default now()
);

-- =========================================================================
-- Triggers — keep products."updatedAt" fresh
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.products enable row level security;
alter table public.subjects enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

-- Catalogue collections: world-readable.
create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Public read subjects" on public.subjects for select to anon, authenticated using (true);
create policy "Public read faqs" on public.faqs for select to anon, authenticated using (true);
create policy "Public read testimonials" on public.testimonials for select to anon, authenticated using (true);

-- Catalogue writes: authenticated (tighten to an admin role before launch).
create policy "Authenticated write products" on public.products for all to authenticated using (true) with check (true);
create policy "Authenticated write subjects" on public.subjects for all to authenticated using (true) with check (true);
create policy "Authenticated write faqs" on public.faqs for all to authenticated using (true) with check (true);
create policy "Authenticated write testimonials" on public.testimonials for all to authenticated using (true) with check (true);

-- Operational records: a customer sees only their own. Server-side functions
-- use the service-role key, which bypasses RLS.
create policy "Customer reads self" on public.customers
  for select to authenticated using (id = auth.uid()::text);

create policy "Customer reads own orders" on public.orders
  for select to authenticated using ("customerId" = auth.uid()::text);

create policy "Customer reads own payments" on public.payments
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = "orderId" and o."customerId" = auth.uid()::text)
  );
