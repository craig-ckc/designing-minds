-- Designing Minds — Supabase schema.
--
-- Supabase owns Auth, Postgres, and launch storage. Vercel serverless
-- functions perform trusted operational writes with the service-role key.
-- Browser clients use the anon key plus a user session JWT and are constrained
-- by RLS.

create extension if not exists pgcrypto;

-- =========================================================================
-- Role helpers
-- =========================================================================

create table if not exists public.user_roles (
  "userId" uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'admin')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create or replace function public.has_role(expected_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur."userId" = auth.uid()
      and ur.role = expected_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

-- =========================================================================
-- Collections
-- =========================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  "shortDescription" text not null default '',
  "fullDescription" text not null default '',
  "priceZar" numeric(10,2) not null default 0,
  grade text not null,
  term text not null,
  year text not null,
  "productKind" text not null check ("productKind" in ('Individual Resource', 'Bundle', 'Access Plan')),
  "resourceFormat" text not null,
  subjects text[] not null default '{}',
  marks integer,
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null default '',
  category text not null default 'General',
  "sortOrder" integer not null default 0,
  published boolean not null default true
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  "customerName" text not null,
  quote text not null,
  context text not null default '',
  "learnerGrade" text,
  "sourceDate" date,
  featured boolean not null default false,
  "sortOrder" integer not null default 0,
  published boolean not null default true
);

create table if not exists public.value_lists (
  key text primary key,
  values text[] not null default '{}',
  "updatedAt" timestamptz not null default now()
);

insert into public.value_lists (key, values)
values
  ('grades', array['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']),
  ('terms', array['Term 1', 'Term 2', 'Term 3', 'Term 4']),
  ('years', array['2024', '2025', '2026']),
  ('productKinds', array['Individual Resource', 'Bundle', 'Access Plan']),
  ('resourceFormats', array['Test / Assessment', 'Summary'])
on conflict (key) do nothing;

-- =========================================================================
-- Operational records
-- =========================================================================

create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  "customerId" uuid not null references public.customers (id) on delete cascade,
  "customerName" text not null,
  "customerEmail" text not null,
  status text not null check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'failed')),
  items jsonb not null default '[]',
  "totalZar" numeric(10,2) not null default 0,
  "paymentId" uuid,
  "placedAt" timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  "orderId" uuid not null references public.orders (id) on delete cascade,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  provider text not null,
  reference text not null,
  "pfPaymentId" text unique,
  "amountZar" numeric(10,2) not null default 0,
  "createdAt" timestamptz not null default now(),
  "processedAt" timestamptz
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null unique references public.customers (id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  "cartId" uuid not null references public.carts (id) on delete cascade,
  "productId" uuid not null references public.products (id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  unique ("cartId", "productId")
);

create index if not exists orders_customer_id_idx on public.orders ("customerId");
create index if not exists payments_order_id_idx on public.payments ("orderId");
create index if not exists cart_items_cart_id_idx on public.cart_items ("cartId");

-- =========================================================================
-- Triggers
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists user_roles_set_updated_at on public.user_roles;
create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute procedure public.set_updated_at();

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1),
    ''
  );

  insert into public.customers (id, name, email)
  values (new.id, display_name, new.email)
  on conflict (id) do nothing;

  insert into public.user_roles ("userId", role)
  values (new.id, 'customer')
  on conflict ("userId") do nothing;

  insert into public.carts ("customerId")
  values (new.id)
  on conflict ("customerId") do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.subjects enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.value_lists enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Drop old wall-version policies so this file can be re-applied during setup.
drop policy if exists "Authenticated write products" on public.products;
drop policy if exists "Authenticated write subjects" on public.subjects;
drop policy if exists "Authenticated write faqs" on public.faqs;
drop policy if exists "Authenticated write testimonials" on public.testimonials;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read subjects" on public.subjects;
drop policy if exists "Public read faqs" on public.faqs;
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Customer reads self" on public.customers;
drop policy if exists "Customer reads own orders" on public.orders;
drop policy if exists "Customer reads own payments" on public.payments;

-- Role table: users may see their own role, but clients cannot write roles.
drop policy if exists "User reads own role" on public.user_roles;
create policy "User reads own role" on public.user_roles
  for select to authenticated using ("userId" = auth.uid());

-- Catalogue collections and value lists: public reads, admin-only writes.
create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Public read subjects" on public.subjects for select to anon, authenticated using (true);
create policy "Public read faqs" on public.faqs for select to anon, authenticated using (true);
create policy "Public read testimonials" on public.testimonials for select to anon, authenticated using (true);
create policy "Public read value lists" on public.value_lists for select to anon, authenticated using (true);

create policy "Admin write products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write subjects" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write faqs" on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write testimonials" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Operational records: customers read own; admins read all; writes are server-only.
create policy "Customer reads self" on public.customers
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "Customer reads own orders" on public.orders
  for select to authenticated using ("customerId" = auth.uid() or public.is_admin());

create policy "Customer reads own payments" on public.payments
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = "orderId"
        and o."customerId" = auth.uid()
    )
  );

-- Cart is the customer-owned client-writable operational exception.
create policy "Customer reads own cart" on public.carts
  for select to authenticated using ("customerId" = auth.uid());

create policy "Customer inserts own cart" on public.carts
  for insert to authenticated with check ("customerId" = auth.uid());

create policy "Customer updates own cart" on public.carts
  for update to authenticated using ("customerId" = auth.uid()) with check ("customerId" = auth.uid());

create policy "Customer deletes own cart" on public.carts
  for delete to authenticated using ("customerId" = auth.uid());

create policy "Customer reads own cart items" on public.cart_items
  for select to authenticated using (
    exists (select 1 from public.carts c where c.id = "cartId" and c."customerId" = auth.uid())
  );

create policy "Customer inserts own cart items" on public.cart_items
  for insert to authenticated with check (
    exists (select 1 from public.carts c where c.id = "cartId" and c."customerId" = auth.uid())
  );

create policy "Customer deletes own cart items" on public.cart_items
  for delete to authenticated using (
    exists (select 1 from public.carts c where c.id = "cartId" and c."customerId" = auth.uid())
  );
