-- Designing Minds — Supabase schema.
--
-- Supabase owns Auth, Postgres, and launch storage. Vercel serverless
-- functions perform trusted operational writes with the secret key.
-- Browser clients use the publishable key plus a user session JWT and are constrained
-- by RLS.

create extension if not exists pgcrypto;

-- Private schema for helpers that must never be reachable through the REST API.
create schema if not exists private;

-- =========================================================================
-- Role helpers
-- =========================================================================

create table if not exists public.user_roles (
  "userId" uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'admin')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- has_role/is_admin only ever read the caller's OWN role, which the
-- "User reads own role" RLS policy already permits, so they run as the caller
-- (security invoker) rather than as a definer. EXECUTE is restricted to
-- signed-in users so they are not reachable by the anon role over REST.
create or replace function public.has_role(expected_role text)
returns boolean
language sql
stable
security invoker
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
security invoker
set search_path = public
as $$
  select public.has_role('admin');
$$;

revoke execute on function public.has_role(text) from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- =========================================================================
-- Collections
-- =========================================================================

-- Individual resources only. Bundles are their own Collection below; there is
-- no "product kind" discriminator any more (see the 2026-08-09 bundles patch).
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  "shortDescription" text not null default '',
  "fullDescription" text not null default '',
  "priceZar" numeric(10,2) not null default 0,
  "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz,
  "saleEndsAt" timestamptz,
  constraint products_sale_valid check (
    ("salePriceZar" is null or ("salePriceZar" > 0 and "salePriceZar" < "priceZar"))
    and ("saleStartsAt" is null or "saleEndsAt" is null or "saleStartsAt" < "saleEndsAt")
  ),
  grade text not null,
  term text not null,
  year text not null,
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
  -- Preview images shown on the Product Detail. The opposite of purchasedFiles:
  -- marketing, not paid content, so these live in the PUBLIC media bucket and
  -- carry their permanent public url inline rather than a key to sign later.
  "galleryImages" jsonb not null default '[]',
  -- Free, publicly downloadable PDF previews shown on the Product Detail —
  -- same reasoning as galleryImages above and the opposite of purchasedFiles:
  -- a marketing download anyone can fetch, so it lives in the PUBLIC media
  -- bucket (its own "previews/" prefix) and carries its permanent public url
  -- inline rather than a key to sign later.
  --
  -- LAST on purpose, together with galleryImages above. published_products()
  -- returns `setof public.products`, which matches POSITIONALLY, and ALTER
  -- TABLE can only append — so a column added mid-list would sit at a
  -- different index on an already-migrated database than on a fresh one, and
  -- the function would compile against only one of them. This constraint
  -- governs the TAIL order (galleryImages, then previewPdfs), not one
  -- specific column: whatever is appended next goes after previewPdfs.
  "previewPdfs" jsonb not null default '[]',
  -- Publish workflow (see the "Publish workflow" section): the editor's
  -- intent, the copy the website serves, and when that copy last changed.
  status text not null default 'draft' check (status in ('draft', 'queued', 'published', 'archived')),
  live jsonb,
  "publishedAt" timestamptz
);

-- A priced package of individual resources. Subjects, terms, file count and
-- value are DERIVED from bundle_products — never stored here, so a bundle can
-- never disagree with what it contains.
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  "shortDescription" text not null default '',
  "fullDescription" text not null default '',
  "priceZar" numeric(10,2) not null default 0,
  "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz,
  "saleEndsAt" timestamptz,
  constraint bundles_sale_valid check (
    ("salePriceZar" is null or ("salePriceZar" > 0 and "salePriceZar" < "priceZar"))
    and ("saleStartsAt" is null or "saleEndsAt" is null or "saleStartsAt" < "saleEndsAt")
  ),
  grade text not null,
  term text not null,
  year text not null,
  "bundleScope" text check ("bundleScope" in ('Term', 'Full Year')),
  "galleryImages" jsonb not null default '[]',
  featured boolean not null default false,
  published boolean not null default false,
  "sortOrder" integer not null default 0,
  seo jsonb not null default '{}',
  faqs text[] not null default '{}',
  "updatedAt" timestamptz not null default now(),
  -- Free, publicly downloadable PDF previews shown on the Product Detail —
  -- same reasoning as galleryImages above and the opposite of purchasedFiles:
  -- a marketing download anyone can fetch, so it lives in the PUBLIC media
  -- bucket (its own "previews/" prefix) and carries its permanent public url
  -- inline. published_bundles() declares its own return row type (not `setof
  -- public.bundles`), so unlike products this position is free — kept last
  -- here to match how ALTER TABLE appends it on an already-migrated database.
  "previewPdfs" jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'queued', 'published', 'archived')),
  live jsonb,
  "publishedAt" timestamptz
);

-- Membership as real foreign keys: deleting a resource removes it from every
-- bundle, instead of leaving a dangling slug inside a text[].
create table if not exists public.bundle_products (
  "bundleId" uuid not null references public.bundles (id) on delete cascade,
  "productId" uuid not null references public.products (id) on delete cascade,
  "sortOrder" integer not null default 0,
  primary key ("bundleId", "productId")
);

create index if not exists bundle_products_product_idx on public.bundle_products ("productId");
create index if not exists bundles_published_idx on public.bundles (published);

-- Products and bundles share the /shop/<slug> URL space, so a slug has to be
-- unique across BOTH tables. A check constraint can't span tables; this can.
create or replace function public.assert_catalog_slug_unique()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'products' then
    if exists (select 1 from public.bundles b where b.slug = new.slug) then
      raise exception 'Slug "%" is already used by a bundle.', new.slug
        using errcode = 'unique_violation';
    end if;
  else
    if exists (select 1 from public.products p where p.slug = new.slug) then
      raise exception 'Slug "%" is already used by a product.', new.slug
        using errcode = 'unique_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_slug_unique_across_catalog on public.products;
create trigger products_slug_unique_across_catalog
before insert or update of slug on public.products
for each row execute procedure public.assert_catalog_slug_unique();

drop trigger if exists bundles_slug_unique_across_catalog on public.bundles;
create trigger bundles_slug_unique_across_catalog
before insert or update of slug on public.bundles
for each row execute procedure public.assert_catalog_slug_unique();

-- set_bundle_products() (membership writes from the admin) lives in the
-- "Publish workflow" section: a membership change re-queues a Published bundle.

-- The public catalogue views (catalog_products, catalog_bundles, catalog_faqs,
-- catalog_testimonials) read each record's LIVE copy and are defined in the
-- "Publish workflow" section below, once every table they read exists.

-- Subjects are a controlled value list (value_lists.subjects), not a table.
-- products.subjects / includedSubjects store subject display names directly,
-- self-describing like grade/term. See the value_lists seed below.

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null default '',
  category text not null default 'General',
  "sortOrder" integer not null default 0,
  published boolean not null default false,
  "updatedAt" timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'queued', 'published', 'archived')),
  live jsonb,
  "publishedAt" timestamptz
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
  published boolean not null default false,
  "updatedAt" timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'queued', 'published', 'archived')),
  live jsonb,
  "publishedAt" timestamptz
);

create table if not exists public.value_lists (
  key text primary key,
  values text[] not null default '{}',
  "updatedAt" timestamptz not null default now()
);

insert into public.value_lists (key, values)
values
  ('grades', array['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']),
  ('terms', array['Any Term', 'Term 1', 'Term 2', 'Term 3', 'Term 4']),
  ('years', array['2024', '2025', '2026']),
  ('resourceFormats', array['Summary', 'Test / Assessment']),
  ('subjects', array[
    'Afrikaans First Additional Language', 'Economic Management Sciences (EMS)',
    'English First Additional Language', 'English Home Language', 'Geography', 'History',
    'Life Orientation', 'Life Skills', 'Life Skills (PSW)', 'Mathematics',
    'Natural Science', 'Natural Science and Technology', 'Technology'
  ])
on conflict (key) do nothing;

-- =========================================================================
-- Operational records
-- =========================================================================

-- Account profile for every authenticated person, Customer or Administrator,
-- keyed by auth.users.id. The role lives in user_roles, not here; this table is
-- named for the account, not the Customer role (see docs/decisions.md).
-- Order/cart ownership columns stay "customerId" because only Customers own them.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  "customerId" uuid not null references public.users (id) on delete cascade,
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
  "customerId" uuid not null unique references public.users (id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- A cart line holds exactly one of a resource or a bundle.
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  "cartId" uuid not null references public.carts (id) on delete cascade,
  "productId" uuid references public.products (id) on delete cascade,
  "bundleId" uuid references public.bundles (id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  unique ("cartId", "productId"),
  constraint cart_items_one_target check (num_nonnulls("productId", "bundleId") = 1)
);

-- The unique above still guards resources (NULLs never collide); bundles need
-- their own partial unique index.
create unique index if not exists cart_items_cart_bundle_key
  on public.cart_items ("cartId", "bundleId")
  where "bundleId" is not null;

create index if not exists orders_customer_id_idx on public.orders ("customerId");
create index if not exists payments_order_id_idx on public.payments ("orderId");
create index if not exists cart_items_cart_id_idx on public.cart_items ("cartId");

-- =========================================================================
-- Triggers
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Publishing must not look like an edit: "updatedAt" stays the editor's time.
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    return new;
  end if;
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

-- Editable CMS collections stamp "updatedAt" so the admin can compare each
-- record against the deployed site's content timestamp (see build-info.json).
drop trigger if exists bundles_set_updated_at on public.bundles;
create trigger bundles_set_updated_at
before update on public.bundles
for each row execute procedure public.set_updated_at();

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
before update on public.faqs
for each row execute procedure public.set_updated_at();

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
before update on public.testimonials
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

  insert into public.users (id, name, email)
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

-- handle_new_user must stay SECURITY DEFINER for the trigger to seed locked
-- tables, but it should never be callable through /rest/v1/rpc. The trigger
-- still fires regardless of these EXECUTE grants.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.create_pending_order(
  p_order_id uuid,
  p_payment_id uuid,
  p_reference text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_items jsonb,
  p_total_zar numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.orders (
    id,
    reference,
    "customerId",
    "customerName",
    "customerEmail",
    status,
    items,
    "totalZar",
    "paymentId"
  )
  values (
    p_order_id,
    p_reference,
    p_customer_id,
    p_customer_name,
    p_customer_email,
    'pending',
    p_items,
    p_total_zar,
    p_payment_id
  );

  insert into public.payments (
    id,
    "orderId",
    status,
    provider,
    reference,
    "amountZar"
  )
  values (
    p_payment_id,
    p_order_id,
    'pending',
    'PayFast',
    p_reference,
    p_total_zar
  );
end;
$$;

revoke all on function public.create_pending_order(uuid, uuid, text, uuid, text, text, jsonb, numeric) from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid, uuid, text, uuid, text, text, jsonb, numeric) to service_role;

-- A paid order takes its lines out of the customer's saved cart. The website
-- clears the browser copy when PayFast sends the shopper back, but the ITN can
-- land while they are still on PayFast — or they may never come back — so the
-- account copy is cleared here, where the status actually changes, whichever
-- path changes it. Only the purchased lines go: anything added since checkout
-- is still wanted. Definer so the delete is not subject to the caller's
-- cart_items policies — an administrator marking an order paid has none and
-- would silently clear nothing. Order lines are a JSONB snapshot, so the slug
-- is read off each line and resolved against products and bundles, which
-- share one slug space.
create or replace function public.clear_purchased_cart_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchased_slugs text[];
begin
  if new.status not in ('paid', 'fulfilled') then
    return new;
  end if;
  -- Only the first move into a paid state has anything to clear; paid ->
  -- fulfilled and re-saves of a paid order are no-ops.
  if tg_op = 'UPDATE' and old.status in ('paid', 'fulfilled') then
    return new;
  end if;
  if jsonb_typeof(new.items) <> 'array' then
    return new;
  end if;

  select coalesce(array_agg(item ->> 'productSlug'), '{}')
    into purchased_slugs
    from jsonb_array_elements(new.items) as item
    where item ->> 'productSlug' is not null;

  delete from public.cart_items ci
  using public.carts c
  where ci."cartId" = c.id
    and c."customerId" = new."customerId"
    and (
      ci."productId" in (select p.id from public.products p where p.slug = any (purchased_slugs))
      or ci."bundleId" in (select b.id from public.bundles b where b.slug = any (purchased_slugs))
    );

  return new;
end;
$$;

revoke execute on function public.clear_purchased_cart_items() from public, anon, authenticated;

drop trigger if exists orders_clear_purchased_cart_items on public.orders;
create trigger orders_clear_purchased_cart_items
after insert or update of status on public.orders
for each row execute procedure public.clear_purchased_cart_items();

-- =========================================================================
-- Publish workflow
-- =========================================================================
--
-- Every editable catalogue record (products, bundles, faqs, testimonials)
-- carries its editor's intent in `status` — draft | queued | published |
-- archived — and the copy the website, cart and checkout serve in `live`.
-- Saving only ever touches the working columns; public.publish_site_content()
-- promotes Queued records to live and removes Archived ones, and is the only
-- writer of live / published / "publishedAt". `published` therefore means "has
-- a live copy". See supabase/patch/2026-10-01-publish-workflow.sql.

-- Helpers --------------------------------------------------------------

-- The live copy of a row: everything except the publish bookkeeping itself.
create or replace function private.live_copy(row_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select row_data - 'status' - 'live' - 'published' - 'publishedAt';
$$;

-- What counts as "the content changed": the live copy minus the edit stamp and
-- the bundle membership snapshot (membership has its own check in
-- set_bundle_products).
create or replace function private.content_of(row_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select private.live_copy(row_data) - 'updatedAt' - 'includedProductIds';
$$;

-- A bundle's live copy also freezes its membership, in display order.
create or replace function private.bundle_live_copy(b public.bundles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.live_copy(to_jsonb(b)) || jsonb_build_object(
    'includedProductIds',
    coalesce(
      (
        select jsonb_agg(bp."productId" order by bp."sortOrder", p."sortOrder", p.title)
        from public.bundle_products bp
        join public.products p on p.id = bp."productId"
        where bp."bundleId" = b.id
      ),
      '[]'::jsonb
    )
  );
$$;

-- Guard: editors can't write the live copy, or claim "published" -------
--
-- The admin sends whole records back on save, including whatever `status` it
-- last read. Without this, a CSV import or a background upload could leave a
-- changed row reading Published while the live copy is older.

create or replace function private.guard_publish_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.live := null;
    new.published := false;
    new."publishedAt" := null;
    if new.status = 'published' then
      new.status := 'queued';
    end if;
    return new;
  end if;

  new.live := old.live;
  new.published := old.published;
  new."publishedAt" := old."publishedAt";
  if new.status = 'published'
     and (old.status <> 'published'
          or old.live is null
          or private.content_of(to_jsonb(new)) is distinct from private.content_of(old.live)) then
    new.status := 'queued';
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard_publish on public.products;
create trigger products_guard_publish
before insert or update on public.products
for each row execute procedure private.guard_publish_columns();

drop trigger if exists bundles_guard_publish on public.bundles;
create trigger bundles_guard_publish
before insert or update on public.bundles
for each row execute procedure private.guard_publish_columns();

drop trigger if exists faqs_guard_publish on public.faqs;
create trigger faqs_guard_publish
before insert or update on public.faqs
for each row execute procedure private.guard_publish_columns();

drop trigger if exists testimonials_guard_publish on public.testimonials;
create trigger testimonials_guard_publish
before insert or update on public.testimonials
for each row execute procedure private.guard_publish_columns();

-- A membership change on a Published bundle is a content change too.
create or replace function public.set_bundle_products(p_bundle_id uuid, p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_ids uuid[];
  after_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = 'insufficient_privilege';
  end if;

  select array_agg("productId" order by "sortOrder") into before_ids
  from public.bundle_products where "bundleId" = p_bundle_id;

  delete from public.bundle_products
  where "bundleId" = p_bundle_id
    and "productId" <> all (coalesce(p_product_ids, '{}'::uuid[]));

  insert into public.bundle_products ("bundleId", "productId", "sortOrder")
  select p_bundle_id, ids.id, ids.ord::int
  from unnest(coalesce(p_product_ids, '{}'::uuid[])) with ordinality as ids(id, ord)
  on conflict ("bundleId", "productId") do update set "sortOrder" = excluded."sortOrder";

  select array_agg("productId" order by "sortOrder") into after_ids
  from public.bundle_products where "bundleId" = p_bundle_id;

  if before_ids is distinct from after_ids then
    update public.bundles set status = 'queued' where id = p_bundle_id and status = 'published';
  end if;
end;
$$;

revoke execute on function public.set_bundle_products(uuid, uuid[]) from public, anon;
grant execute on function public.set_bundle_products(uuid, uuid[]) to authenticated;

-- Publish ---------------------------------------------------------------

create or replace function public.publish_site_content()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  at timestamptz := now();
  promoted integer := 0;
  removed integer := 0;
  n integer;
begin
  perform set_config('app.publishing', 'on', true);

  update public.products p
  set live = private.live_copy(to_jsonb(p)), published = true, status = 'published', "publishedAt" = at
  where p.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.bundles b
  set live = private.bundle_live_copy(b), published = true, status = 'published', "publishedAt" = at
  where b.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.faqs f
  set live = private.live_copy(to_jsonb(f)), published = true, status = 'published', "publishedAt" = at
  where f.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.testimonials t
  set live = private.live_copy(to_jsonb(t)), published = true, status = 'published', "publishedAt" = at
  where t.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.products set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.bundles set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.faqs set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.testimonials set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  perform set_config('app.publishing', 'off', true);
  return jsonb_build_object('promoted', promoted, 'removed', removed, 'publishedAt', at);
end;
$$;

revoke execute on function public.publish_site_content() from public, anon, authenticated;
grant execute on function public.publish_site_content() to service_role;

-- Public catalogue reads the live copy ----------------------------------
--
-- Both functions now declare their row type, so the old "column position must
-- match public.products" constraint is gone. CREATE OR REPLACE cannot change a
-- return type, hence drop + create (cascade takes the views with it).

drop function if exists private.published_products() cascade;
create function private.published_products()
returns table (
  id uuid,
  slug text,
  title text,
  "shortDescription" text,
  "fullDescription" text,
  "priceZar" numeric(10,2),
  grade text,
  term text,
  year text,
  "resourceFormat" text,
  subjects text[],
  marks integer,
  "purchasedFiles" jsonb,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "galleryImages" jsonb,
  "previewPdfs" jsonb,
  status text,
  "publishedAt" timestamptz,
  "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz,
  "saleEndsAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.slug,
    l.title,
    l."shortDescription",
    l."fullDescription",
    l."priceZar",
    l.grade,
    l.term,
    l.year,
    l."resourceFormat",
    l.subjects,
    l.marks,
    -- Storage keys never leave the database: the public copy names the file
    -- but carries nothing to sign.
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', file ->> 'id',
            'label', file ->> 'label',
            'filename', file ->> 'filename'
          )
          order by file ->> 'id'
        )
        from jsonb_array_elements(coalesce(l."purchasedFiles", '[]'::jsonb)) as file
      ),
      '[]'::jsonb
    ),
    l.featured,
    true,
    l."sortOrder",
    l.seo,
    l.faqs,
    l."updatedAt",
    coalesce(l."galleryImages", '[]'::jsonb),
    coalesce(l."previewPdfs", '[]'::jsonb),
    'published'::text,
    p."publishedAt",
    l."salePriceZar", l."saleStartsAt", l."saleEndsAt"
  from public.products p
  cross join lateral jsonb_populate_record(null::public.products, p.live) l
  where p.live is not null;
$$;

drop function if exists private.published_bundles() cascade;
create function private.published_bundles()
returns table (
  id uuid,
  slug text,
  title text,
  "shortDescription" text,
  "fullDescription" text,
  "priceZar" numeric(10,2),
  grade text,
  term text,
  year text,
  "bundleScope" text,
  "galleryImages" jsonb,
  "previewPdfs" jsonb,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "includedProductIds" uuid[],
  "includedProductSlugs" text[],
  status text,
  "publishedAt" timestamptz,
  "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz,
  "saleEndsAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.slug,
    l.title,
    l."shortDescription",
    l."fullDescription",
    l."priceZar",
    l.grade,
    l.term,
    l.year,
    l."bundleScope",
    coalesce(l."galleryImages", '[]'::jsonb),
    coalesce(l."previewPdfs", '[]'::jsonb),
    l.featured,
    true,
    l."sortOrder",
    l.seo,
    l.faqs,
    l."updatedAt",
    coalesce(members.ids, '{}'::uuid[]),
    coalesce(members.slugs, '{}'::text[]),
    'published'::text,
    b."publishedAt",
    l."salePriceZar", l."saleStartsAt", l."saleEndsAt"
  from public.bundles b
  cross join lateral jsonb_populate_record(null::public.bundles, b.live) l
  -- Membership as frozen at publish, narrowed to resources that are live
  -- themselves: a resource that isn't on the site isn't bundle contents.
  left join lateral (
    select
      array_agg(p.id order by m.ord)               as ids,
      array_agg(p.live ->> 'slug' order by m.ord)  as slugs
    from jsonb_array_elements_text(coalesce(b.live -> 'includedProductIds', '[]'::jsonb)) with ordinality as m(product_id, ord)
    join public.products p on p.id = m.product_id::uuid
    where p.live is not null
  ) members on true
  where b.live is not null;
$$;

create or replace function private.published_faqs()
returns table (
  id uuid,
  question text,
  answer text,
  category text,
  "sortOrder" integer,
  published boolean,
  "updatedAt" timestamptz,
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.question, l.answer, l.category, l."sortOrder", true, l."updatedAt", 'published'::text, f."publishedAt"
  from public.faqs f
  cross join lateral jsonb_populate_record(null::public.faqs, f.live) l
  where f.live is not null;
$$;

create or replace function private.published_testimonials()
returns table (
  id uuid,
  "customerName" text,
  quote text,
  context text,
  "learnerGrade" text,
  "sourceDate" date,
  featured boolean,
  "sortOrder" integer,
  published boolean,
  "updatedAt" timestamptz,
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l."customerName", l.quote, l.context, l."learnerGrade", l."sourceDate", l.featured, l."sortOrder",
    true, l."updatedAt", 'published'::text, t."publishedAt"
  from public.testimonials t
  cross join lateral jsonb_populate_record(null::public.testimonials, t.live) l
  where t.live is not null;
$$;

revoke execute on function private.published_products() from public;
revoke execute on function private.published_bundles() from public;
revoke execute on function private.published_faqs() from public;
revoke execute on function private.published_testimonials() from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.published_products() to anon, authenticated, service_role;
grant execute on function private.published_bundles() to anon, authenticated, service_role;
grant execute on function private.published_faqs() to anon, authenticated, service_role;
grant execute on function private.published_testimonials() to anon, authenticated, service_role;

create or replace view public.catalog_products
with (security_invoker = on) as
  select * from private.published_products();

create or replace view public.catalog_bundles
with (security_invoker = on) as
  select * from private.published_bundles();

create or replace view public.catalog_faqs
with (security_invoker = on) as
  select * from private.published_faqs();

create or replace view public.catalog_testimonials
with (security_invoker = on) as
  select * from private.published_testimonials();

grant select on public.catalog_products to anon, authenticated, service_role;
grant select on public.catalog_bundles to anon, authenticated, service_role;
grant select on public.catalog_faqs to anon, authenticated, service_role;
grant select on public.catalog_testimonials to anon, authenticated, service_role;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_products enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.value_lists enable row level security;
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Drop old wall-version policies so this file can be re-applied during setup.
drop policy if exists "Authenticated write products" on public.products;
drop policy if exists "Authenticated write faqs" on public.faqs;
drop policy if exists "Authenticated write testimonials" on public.testimonials;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read faqs" on public.faqs;
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Customer reads self" on public.users;
drop policy if exists "Customer reads own orders" on public.orders;
drop policy if exists "Customer reads own payments" on public.payments;
drop policy if exists "Admin write bundles" on public.bundles;
drop policy if exists "Admin write bundle products" on public.bundle_products;

-- Role table: users may see their own role, but clients cannot write roles.
drop policy if exists "User reads own role" on public.user_roles;
create policy "User reads own role" on public.user_roles
  for select to authenticated using ("userId" = auth.uid());

-- Catalogue collections and value lists: public reads go through sanitized views; admin-only writes.
create policy "Public read value lists" on public.value_lists for select to anon, authenticated using (true);


create policy "Admin write products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write bundles" on public.bundles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write bundle products" on public.bundle_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write faqs" on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write testimonials" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Operational records: customers read own; admins read all; writes are server-only.
create policy "Customer reads self" on public.users
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

-- =========================================================================
-- System-managed slug redirects
-- =========================================================================
--
-- Product Detail pages are public and indexable, so a slug change must leave a
-- permanent redirect from the old URL to the new canonical URL (web static
-- generation design). Redirects are SYSTEM-managed: not a CMS collection, never
-- hand-edited in admin. A trigger on public.products records them automatically.

create table if not exists public.slug_redirects (
  id uuid primary key default gen_random_uuid(),
  "entityType" text not null default 'product' check ("entityType" in ('product', 'bundle')),
  "entityId" uuid,
  "fromPath" text not null unique,
  "toPath" text not null,
  "statusCode" integer not null default 301 check ("statusCode" in (301, 308)),
  "createdAt" timestamptz not null default now(),
  "createdBy" uuid references auth.users (id) on delete set null,
  constraint slug_redirects_from_not_to check ("fromPath" <> "toPath")
);

create index if not exists slug_redirects_to_path_idx on public.slug_redirects ("toPath");

-- Records old -> new whenever a catalogue slug changes, collapsing chains so
-- /shop/a -> /shop/b -> /shop/c becomes a -> c and b -> c. Definer so it
-- writes slug_redirects regardless of who did the update. Products and
-- bundles share /shop/<slug>, so both use this — the entity type comes from
-- whichever table fired it.
create or replace function public.handle_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_path text := '/shop/' || old.slug;
  new_path text := '/shop/' || new.slug;
  entity   text := case when tg_table_name = 'bundles' then 'bundle' else 'product' end;
begin
  if new.slug is distinct from old.slug then
    update public.slug_redirects
      set "toPath" = new_path
      where "toPath" = old_path;

    delete from public.slug_redirects where "fromPath" = new_path;

    insert into public.slug_redirects ("entityType", "entityId", "fromPath", "toPath", "statusCode", "createdBy")
    values (entity, new.id, old_path, new_path, 301, auth.uid())
    on conflict ("fromPath") do update
      set "toPath" = excluded."toPath",
          "entityId" = excluded."entityId",
          "entityType" = excluded."entityType",
          "statusCode" = excluded."statusCode";
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_product_slug_change() from public, anon, authenticated;

drop trigger if exists products_slug_redirect on public.products;
create trigger products_slug_redirect
after update of slug on public.products
for each row execute procedure public.handle_product_slug_change();

drop trigger if exists bundles_slug_redirect on public.bundles;
create trigger bundles_slug_redirect
after update of slug on public.bundles
for each row execute procedure public.handle_product_slug_change();

-- Public build-time read surface: only redirects whose target is a published
-- product or bundle. Definer function in the private schema strips
-- unpublished targets; the security_invoker view exposes the sanitized result
-- to anon. A redirect is kept if EITHER catalogue serves its target — both
-- live under /shop/<slug>, so the check is on the path, not the entity type.
create or replace function private.active_slug_redirects()
returns setof public.slug_redirects
language sql
stable
security definer
set search_path = ''
as $$
  select sr.*
  from public.slug_redirects sr
  where exists (
      select 1
      from public.products p
      where p.live is not null
        and ('/shop/' || (p.live ->> 'slug')) = sr."toPath"
    )
     or exists (
      select 1
      from public.bundles b
      where b.live is not null
        and ('/shop/' || (b.live ->> 'slug')) = sr."toPath"
    );
$$;

revoke execute on function private.active_slug_redirects() from public;
grant execute on function private.active_slug_redirects() to anon, authenticated;

create or replace view public.active_slug_redirects
with (security_invoker = on) as
  select * from private.active_slug_redirects();

grant select on public.active_slug_redirects to anon, authenticated;

alter table public.slug_redirects enable row level security;
drop policy if exists "Admin reads slug redirects" on public.slug_redirects;
create policy "Admin reads slug redirects" on public.slug_redirects
  for select to authenticated using (public.is_admin());

-- =========================================================================
-- Form submissions (contact + newsletter)
-- =========================================================================
--
-- Public forms are persisted ONLY by the trusted functions app (secret key),
-- exactly like orders/payments — the browser never writes here, so there is no
-- anon insert policy and RLS is default-deny for everyone but admins (read).
-- One table per form (form_<name>): stable identity/metadata as columns, and
-- the variable per-form fields in the "data" jsonb bag so new fields need no
-- migration. See supabase/patch/2026-07-02-form-submissions.sql.

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

-- Searchable operational events. Apply before enabling DIAGNOSTICS_ENABLED.
-- Browser submissions are untrusted, write-only, sanitized by the API, and rate-limited here.
begin;

create table if not exists public.diagnostic_events (
  id uuid primary key,
  "receivedAt" timestamptz not null default now(),
  "occurredAt" timestamptz not null,
  sequence integer not null default 0 check (sequence between 0 and 1000000),
  source text not null check (source in ('browser', 'server')),
  level text not null check (level in ('info', 'warning', 'error')),
  event text not null check (length(event) <= 64),
  route text not null check (length(route) <= 100),
  "requestId" uuid,
  "sessionId" uuid,
  "orderId" uuid,
  status integer check (status between 0 and 599),
  "durationMs" integer check ("durationMs" between 0 and 3600000),
  "errorKind" text check (length("errorKind") <= 32),
  code text check (length(code) <= 8),
  asset text check (length(asset) <= 150),
  release text check (length(release) <= 40)
);
create index if not exists diagnostic_events_timeline on public.diagnostic_events ("occurredAt" desc, sequence desc, id desc);
create index if not exists diagnostic_events_received on public.diagnostic_events ("receivedAt" desc);
create index if not exists diagnostic_events_request on public.diagnostic_events ("requestId", "receivedAt" desc);
create index if not exists diagnostic_events_session on public.diagnostic_events ("sessionId", "receivedAt" desc);
create index if not exists diagnostic_events_order on public.diagnostic_events ("orderId", "receivedAt" desc);
create index if not exists diagnostic_events_level on public.diagnostic_events (level, "receivedAt" desc);
alter table public.diagnostic_events enable row level security;
revoke all on public.diagnostic_events from public, anon, authenticated;
grant select on public.diagnostic_events to authenticated;
grant all on public.diagnostic_events to service_role;
drop policy if exists "Admins read diagnostics" on public.diagnostic_events;
create policy "Admins read diagnostics" on public.diagnostic_events
  for select to authenticated using (public.is_admin());

-- Only the server can execute this RPC. Serialization makes limits effective
-- across concurrent serverless instances. Duplicate retries keep their event IDs.
create or replace function public.record_diagnostic_events(p_events jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  n integer;
  session_entry record;
begin
  if jsonb_typeof(p_events) <> 'array' then return false; end if;
  n := jsonb_array_length(p_events);
  if n < 1 or n > 30 or octet_length(p_events::text) > 40000 then return false; end if;
  perform pg_advisory_xact_lock(93470909);
  if (select count(*) from public.diagnostic_events where "receivedAt" > now() - interval '1 hour') + n > 10000 then
    return false;
  end if;
  if exists (select 1 from jsonb_array_elements(p_events) e where e->>'source' = 'browser') then
    if (select count(*) from public.diagnostic_events where source = 'browser' and "receivedAt" > now() - interval '1 minute') + n > 600 then
      return false;
    end if;
    for session_entry in
      select (e->>'sessionId')::uuid as session_id, count(*) as batch_count
      from jsonb_array_elements(p_events) e where e->>'source' = 'browser' group by 1
    loop
      if (select count(*) from public.diagnostic_events where source = 'browser'
        and "sessionId" is not distinct from session_entry.session_id and "receivedAt" > now() - interval '1 minute') + session_entry.batch_count > 120 then
        return false;
      end if;
    end loop;
  end if;
  insert into public.diagnostic_events (id, "occurredAt", sequence, source, level, event, route, "requestId", "sessionId", "orderId", status, "durationMs", "errorKind", code, asset, release)
  select x.id, x."occurredAt", coalesce(x.sequence, 0), x.source, x.level, x.event, x.route, x."requestId", x."sessionId", x."orderId", x.status, x."durationMs", x."errorKind", x.code, x.asset, x.release
  from jsonb_to_recordset(p_events) as x(id uuid, "occurredAt" timestamptz, sequence integer, source text, level text, event text, route text,
    "requestId" uuid, "sessionId" uuid, "orderId" uuid, status integer, "durationMs" integer, "errorKind" text, code text, asset text, release text)
  on conflict (id) do nothing;
  return true;
end;
$$;
revoke all on function public.record_diagnostic_events(jsonb) from public, anon, authenticated;
grant execute on function public.record_diagnostic_events(jsonb) to service_role;

-- Enable Supabase Cron and run the companion retention patch before enabling collection.
commit;

-- Called only after signature, source-IP, amount and PayFast validation succeed.
-- No existing records are modified by applying this migration.
create or replace function public.complete_payfast_payment(
  p_payment_id uuid, p_pf_payment_id text, p_amount_zar numeric
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  payment public.payments%rowtype;
  purchase public.orders%rowtype;
  was_succeeded boolean;
begin
  if p_pf_payment_id is null or btrim(p_pf_payment_id) = '' or p_amount_zar is null or p_amount_zar <= 0 then
    return 'rejected';
  end if;
  select * into payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  select * into purchase from public.orders where id = payment."orderId" for update;
  if not found then raise exception 'Order not found'; end if;

  -- Never overwrite refunds, failed records, another transaction or a mismatched order.
  if payment.provider <> 'PayFast' or payment."amountZar" <> p_amount_zar or purchase."totalZar" <> p_amount_zar
    or purchase."paymentId" is distinct from payment.id
    or payment.status not in ('pending', 'succeeded') or purchase.status not in ('pending', 'paid', 'fulfilled')
    or (payment."pfPaymentId" is not null and payment."pfPaymentId" <> p_pf_payment_id)
    or exists (select 1 from public.payments where "pfPaymentId" = p_pf_payment_id and id <> payment.id)
  then return 'rejected'; end if;

  was_succeeded := payment.status = 'succeeded';
  if was_succeeded and (payment."processedAt" is null or payment."pfPaymentId" is null) then return 'rejected'; end if;
  if was_succeeded and purchase.status in ('paid', 'fulfilled') then return 'duplicate'; end if;

  if not was_succeeded then
    update public.payments set status = 'succeeded', "pfPaymentId" = p_pf_payment_id, "processedAt" = now()
      where id = payment.id;
  end if;
  if purchase.status = 'pending' then
    -- Includes the cart-clearing trigger. Any failure rolls back BOTH updates.
    update public.orders set status = 'paid' where id = purchase.id;
  end if;
  return case when was_succeeded then 'recovered' else 'processed' end;
end;
$$;
revoke all on function public.complete_payfast_payment(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.complete_payfast_payment(uuid, text, numeric) to service_role;

-- Promotions: published sale schedules and atomic reservations.
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9_-]{1,40}$'),
  "discountType" text not null check ("discountType" in ('percentage','fixed')),
  value numeric(10,2) not null check (value > 0 and value < 'Infinity'::numeric and ("discountType" <> 'percentage' or value <= 100)),
  enabled boolean not null default false,
  "allowSaleItems" boolean not null default false,
  "startsAt" timestamptz,
  "expiresAt" timestamptz,
  "updatedAt" timestamptz not null default now(),
  constraint coupons_dates_valid check ("startsAt" is null or "expiresAt" is null or "startsAt" < "expiresAt")
);
create unique index if not exists coupons_code_unique on public.coupons (upper(code));
create or replace function private.normalize_coupon_code() returns trigger language plpgsql set search_path = '' as $$
begin new.code := upper(btrim(new.code)); return new; end;
$$;
drop trigger if exists coupons_normalize on public.coupons;
create trigger coupons_normalize before insert or update on public.coupons for each row execute function private.normalize_coupon_code();
drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();
alter table public.coupons enable row level security;
drop policy if exists "Admin manage coupons" on public.coupons;
-- Disable instead of deleting: an old code must retain its usage history.
create policy "Admin manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select,insert,update on public.coupons to authenticated;
revoke delete on public.coupons from authenticated;
grant all on public.coupons to service_role;

alter table public.orders add column if not exists "subtotalZar" numeric(10,2);
alter table public.orders add column if not exists "discountZar" numeric(10,2) not null default 0;
alter table public.orders add column if not exists "couponCode" text;
alter table public.orders add column if not exists "couponId" uuid references public.coupons(id) on delete restrict;
create table if not exists public.coupon_redemptions (
  "couponId" uuid not null references public.coupons(id) on delete restrict,
  "customerId" uuid not null references public.users(id) on delete restrict,
  "orderId" uuid not null unique references public.orders(id) on delete restrict,
  primary key ("couponId", "customerId")
);
alter table public.coupon_redemptions enable row level security;
grant all on public.coupon_redemptions to service_role;

create or replace function public.promotion_price(
  price numeric, sale numeric, starts timestamptz, ends timestamptz, at_time timestamptz
) returns numeric language sql stable set search_path = '' as $$
  select case when sale > 0 and sale < price and (starts is null or starts <= at_time) and (ends is null or at_time < ends)
    then sale else price end;
$$;

create or replace function public.quote_promotional_order(p_customer_id uuid, p_slugs text[], p_coupon_code text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  slugs text[];
  coupon public.coupons%rowtype;
  previous public.orders%rowtype;
  lines jsonb;
  subtotal numeric;
  eligible numeric;
  discount numeric := 0;
  coupon_code text := nullif(upper(btrim(p_coupon_code)), '');
begin
  select array_agg(distinct s order by s) into slugs from unnest(p_slugs) s;
  if coalesce(cardinality(slugs),0) = 0 then raise exception 'Cart is empty.'; end if;
  if coupon_code is not null then
    select * into coupon from public.coupons where code = coupon_code;
    if not found then raise exception 'Invalid discount code.'; end if;
    select o.* into previous from public.coupon_redemptions r join public.orders o on o.id=r."orderId"
      where r."couponId"=coupon.id and r."customerId"=p_customer_id;
    if found then
      if previous.status <> 'pending' then raise exception 'You have already used this discount code.'; end if;
      if (select array_agg(i->>'productSlug' order by i->>'productSlug') from jsonb_array_elements(previous.items) i) is distinct from slugs then
        raise exception 'This code is reserved for a pending checkout. Retry the original basket, or wait for a confirmed payment cancellation.';
      end if;
      return jsonb_build_object('items',previous.items,'subtotalZar',previous."subtotalZar",'discountZar',previous."discountZar",
        'totalZar',previous."totalZar",'couponCode',previous."couponCode",'couponId',previous."couponId",
        'orderId',previous.id,'paymentId',previous."paymentId",'reference',previous.reference);
    end if;
    if not coupon.enabled or (coupon."startsAt" is not null and now() < coupon."startsAt") or (coupon."expiresAt" is not null and now() >= coupon."expiresAt") then
      raise exception 'This discount code is inactive or expired.';
    end if;
  end if;
  if exists (select 1 from public.orders o cross join lateral jsonb_array_elements(o.items) i
    where o."customerId"=p_customer_id and o.status in ('paid','fulfilled') and i->>'productSlug'=any(slugs)) then
    raise exception 'Your account already owns one or more cart items.';
  end if;
  select jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'productSlug',slug,'title',title,'productKind',kind,
      'grade',grade,'priceZar',actual,'originalPriceZar',price,'onSale',actual < price) order by slug),
    sum(actual), sum(case when coupon."allowSaleItems" or actual=price then actual else 0 end)
    into lines,subtotal,eligible
  from (
    select slug,title,'Single' as kind,grade,"priceZar" as price,
      public.promotion_price("priceZar","salePriceZar","saleStartsAt","saleEndsAt",now()) as actual
    from public.catalog_products where slug=any(slugs)
    union all
    select slug,title,'Bundle',grade,"priceZar",public.promotion_price("priceZar","salePriceZar","saleStartsAt","saleEndsAt",now())
    from public.catalog_bundles where slug=any(slugs)
  ) catalogue;
  if coalesce(jsonb_array_length(lines),0) <> cardinality(slugs) then raise exception 'One or more cart items are unavailable.'; end if;
  if coupon_code is not null then
    if eligible <= 0 then raise exception 'This discount code does not apply to items already on sale.'; end if;
    discount := least(eligible, case when coupon."discountType"='percentage' then round(eligible * coupon.value / 100,2) else coupon.value end);
  end if;
  if subtotal-discount <= 0 then raise exception 'Order total must be greater than zero. This discount would make the order free.'; end if;
  return jsonb_build_object('items',lines,'subtotalZar',subtotal,'discountZar',discount,'totalZar',subtotal-discount,
    'couponCode',coupon_code,'couponId',coupon.id);
end;
$$;
revoke all on function public.quote_promotional_order(uuid,text[],text) from public,anon,authenticated;
grant execute on function public.quote_promotional_order(uuid,text[],text) to service_role;

create or replace function public.create_promotional_order(p_customer_id uuid, p_slugs text[], p_coupon_code text, p_reference text, p_expected_total_zar numeric default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  quote jsonb;
  customer public.users%rowtype;
  order_id uuid := gen_random_uuid();
  payment_id uuid := gen_random_uuid();
  coupon_id uuid;
begin
  -- Serialize code/customer attempts before quoting, including duplicate requests.
  if nullif(btrim(p_coupon_code),'') is not null then
    select id into coupon_id from public.coupons where code=upper(btrim(p_coupon_code));
    if coupon_id is not null then
      perform pg_advisory_xact_lock(hashtextextended(coupon_id::text || ':' || p_customer_id::text,0));
      -- Also prevent an admin changing this code partway through checkout.
      perform 1 from public.coupons where id=coupon_id for share;
    end if;
  end if;
  quote := public.quote_promotional_order(p_customer_id,p_slugs,p_coupon_code);
  if p_expected_total_zar is not null and (quote->>'totalZar')::numeric <> p_expected_total_zar then
    raise exception 'Prices changed. Review the updated total before paying.';
  end if;
  if quote ? 'orderId' then return quote; end if;
  select * into customer from public.users where id=p_customer_id;
  if not found then raise exception 'Customer account not found.'; end if;
  perform public.create_pending_order(order_id,payment_id,p_reference,customer.id,customer.name,customer.email,
    quote->'items',(quote->>'totalZar')::numeric);
  update public.orders set "subtotalZar"=(quote->>'subtotalZar')::numeric,"discountZar"=(quote->>'discountZar')::numeric,
    "couponCode"=quote->>'couponCode',"couponId"=(quote->>'couponId')::uuid where id=order_id;
  if quote->>'couponId' is not null then
    insert into public.coupon_redemptions ("couponId","customerId","orderId") values ((quote->>'couponId')::uuid,p_customer_id,order_id);
  end if;
  return quote || jsonb_build_object('orderId',order_id,'paymentId',payment_id,'reference',p_reference);
end;
$$;
revoke all on function public.create_promotional_order(uuid,text[],text,text,numeric) from public,anon,authenticated;
grant execute on function public.create_promotional_order(uuid,text[],text,text,numeric) to service_role;

-- The verified webhook marks a payment failed. Move its order and release the
-- reservation in that same transaction, even if the webhook response is lost.
create or replace function private.release_failed_coupon_payment() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='failed' and old.status='pending' and old."processedAt" is null then
    update public.orders set status='failed' where id=new."orderId" and status='pending';
    delete from public.coupon_redemptions r using public.orders o where r."orderId"=o.id and o.id=new."orderId" and o.status='failed';
  end if;
  return new;
end;
$$;
drop trigger if exists release_failed_coupon_payment on public.payments;
create trigger release_failed_coupon_payment after update on public.payments for each row execute function private.release_failed_coupon_payment();

-- A durable cross-instance lease coalesces sale boundaries into one rebuild.
create table if not exists private.promotion_rebuild_state (
  id boolean primary key default true check (id),
  "checkedThrough" timestamptz not null default now(),
  "leaseToken" uuid,
  "leaseUntil" timestamptz,
  "leaseThrough" timestamptz,
  "leaseRequestedAt" timestamptz
);
insert into private.promotion_rebuild_state (id) values (true) on conflict do nothing;
revoke all on private.promotion_rebuild_state from public,anon,authenticated;

create or replace function private.promotion_rebuild_due(p_at timestamptz)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.promotion_rebuild_state s
    where (s."leaseRequestedAt" is not null and s."leaseUntil" > p_at) or ((s."leaseUntil" is null or s."leaseUntil" <= p_at) and exists (
      select 1 from (
        select "saleStartsAt" as starts, "saleEndsAt" as ends from public.catalog_products where "salePriceZar" is not null
        union all
        select "saleStartsAt", "saleEndsAt" from public.catalog_bundles where "salePriceZar" is not null
      ) schedule
      where (schedule.starts > s."checkedThrough" and schedule.starts <= p_at)
        or (schedule.ends > s."checkedThrough" and schedule.ends <= p_at)
    ))
  );
$$;
revoke all on function private.promotion_rebuild_due(timestamptz) from public,anon,authenticated;

create or replace function public.claim_promotion_rebuild(p_at timestamptz default now())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  token uuid := gen_random_uuid();
  through_at timestamptz;
  state private.promotion_rebuild_state%rowtype;
begin
  select * into state from private.promotion_rebuild_state where id for update;
  if state."leaseUntil" > p_at then
    if state."leaseRequestedAt" is null then return null; end if;
    return jsonb_build_object('token',state."leaseToken",'through',state."leaseThrough",'state','waiting');
  end if;
  if not private.promotion_rebuild_due(p_at) then return null; end if;
  -- A slow accepted build may still deploy after its lease expires. Keep its
  -- original watermark so a later tick can acknowledge that deployment.
  -- Boundaries after this watermark are picked up by the next job.
  through_at := coalesce(state."leaseThrough",p_at);
  update private.promotion_rebuild_state set "leaseToken"=token,"leaseUntil"=p_at+interval '10 minutes',"leaseThrough"=through_at,"leaseRequestedAt"=null where id;
  return jsonb_build_object('token',token,'through',through_at,'state','claimed');
end;
$$;
create or replace function public.mark_promotion_rebuild_requested(p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update private.promotion_rebuild_state set "leaseRequestedAt"=now() where id and "leaseToken"=p_token;
  return found;
end;
$$;
revoke all on function public.mark_promotion_rebuild_requested(uuid) from public,anon,authenticated;
grant execute on function public.mark_promotion_rebuild_requested(uuid) to service_role;

create or replace function public.finish_promotion_rebuild(p_token uuid, p_success boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update private.promotion_rebuild_state
    set "checkedThrough"=case when p_success then "leaseThrough" else "checkedThrough" end,
      "leaseToken"=null,"leaseUntil"=null,"leaseThrough"=null,"leaseRequestedAt"=null
    where id and "leaseToken"=p_token;
  return found;
end;
$$;
revoke all on function public.claim_promotion_rebuild(timestamptz), public.finish_promotion_rebuild(uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_promotion_rebuild(timestamptz), public.finish_promotion_rebuild(uuid,boolean) to service_role;

-- =========================================================================
-- Explicit Data API table grants
-- =========================================================================
-- BEGIN core Data API grants
-- PostgREST checks object grants before RLS. These grants are the minimum
-- table privileges used by the public site, customer account/cart, admin CMS,
-- and trusted functions client. Existing RLS policies above remain the row
-- and authorization boundary. Keep this list in sync with the Supabase access
-- paths; do not replace it with broad default privileges.

-- Public readers use sanitized catalogue views; value lists contain public
-- filter choices and are read directly by the browser/build client.
grant select on public.value_lists to anon, authenticated;

-- Authenticated users may read their own role and operational records. RLS
-- restricts these reads to the current customer or admin.
grant select on public.user_roles, public.users, public.orders, public.payments to authenticated;

-- The admin CMS directly edits these collections. bundle_products is read for
-- the bundle embed; membership writes go through the admin-checked RPC.
grant select, insert, update, delete on public.products, public.bundles, public.faqs, public.testimonials to authenticated;
grant select on public.bundle_products to authenticated;

-- Admin screens read form submissions; customer carts are the only client
-- writable operational records. RLS limits each row to its owner.
grant select on public.form_contact, public.form_newsletter to authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, delete on public.cart_items to authenticated;

-- Trusted functions use the service role for these direct data paths. Other
-- server operations use explicitly granted RPCs above and need no table grant.
grant select on public.user_roles, public.users, public.orders, public.payments,
  public.products, public.bundles, public.bundle_products to service_role;
grant update on public.orders, public.payments to service_role;
grant insert on public.form_contact, public.form_newsletter to service_role;
-- END core Data API grants





-- BEGIN physical product foundation (2026-11-10)
-- Physical product data foundation (2026-11-10).
--
-- This patch does not enable physical checkout, public catalogue listings,
-- shipping quotes, or stock reservations. Existing digital checkout remains
-- the only sellable path until those flows have an approved contract.

begin;

-- Product type is appended to preserve the historical column order used by
-- integrations. The public catalogue function has an explicit return shape,
-- so this does not alter its row contract.
alter table public.products
  add column if not exists "productType" text not null default 'digital';
alter table public.products alter column "productType" set default 'digital';
update public.products set "productType" = 'digital' where "productType" is null;
alter table public.products alter column "productType" set not null;

alter table public.products
  add column if not exists "weightGrams" integer,
  add column if not exists "lengthMm" integer,
  add column if not exists "widthMm" integer,
  add column if not exists "heightMm" integer,
  add column if not exists "customizationRules" jsonb not null default '[]'::jsonb;
alter table public.products alter column "customizationRules" set default '[]'::jsonb;
update public.products set "customizationRules" = '[]'::jsonb where "customizationRules" is null;
alter table public.products alter column "customizationRules" set not null;

-- These fields remain required for digital resources exactly as before. A
-- physical product stores no fabricated education classification.
alter table public.products
  alter column grade drop not null,
  alter column term drop not null,
  alter column year drop not null,
  alter column "resourceFormat" drop not null;

create or replace function private.valid_customization_rules(rules jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  rule jsonb;
  rule_key text;
  rule_type text;
  constraints jsonb;
  option_value jsonb;
  seen_keys text[] := '{}'::text[];
  seen_options text[];
  min_length numeric;
  max_length numeric;
  trim_characters text := E' \t\n\r\f' || chr(11) || chr(160) || chr(5760)
    || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197)
    || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232)
    || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279);
begin
  if rules is null or jsonb_typeof(rules) <> 'array' then return false; end if;

  for rule in select value from jsonb_array_elements(rules) as values(value) loop
    if jsonb_typeof(rule) <> 'object'
       or not (rule ? 'key' and rule ? 'label' and rule ? 'type' and rule ? 'required')
       or jsonb_typeof(rule->'key') <> 'string'
       or jsonb_typeof(rule->'label') <> 'string'
       or jsonb_typeof(rule->'type') <> 'string'
       or jsonb_typeof(rule->'required') <> 'boolean' then
      return false;
    end if;

    rule_key := rule->>'key';
    rule_type := rule->>'type';
    if rule_key is null or btrim(rule_key, trim_characters) = ''
       or btrim(rule->>'label', trim_characters) = '' or rule_key = any(seen_keys) then
      return false;
    end if;
    seen_keys := array_append(seen_keys, rule_key);

    if rule_type = 'text' then
      if rule ? 'options' or (rule - 'key' - 'label' - 'type' - 'required' - 'constraints') <> '{}'::jsonb then
        return false;
      end if;
      if rule ? 'constraints' then
        constraints := rule->'constraints';
        if jsonb_typeof(constraints) <> 'object'
           or (constraints - 'minLength' - 'maxLength' - 'allowedCharacters' - 'allowSpaces') <> '{}'::jsonb then
          return false;
        end if;
        if constraints ? 'minLength' then
          if jsonb_typeof(constraints->'minLength') <> 'number' then return false; end if;
          min_length := (constraints->>'minLength')::numeric;
          if min_length < 0 or min_length <> trunc(min_length) or min_length > 2147483647 then return false; end if;
        else
          min_length := null;
        end if;
        if constraints ? 'maxLength' then
          if jsonb_typeof(constraints->'maxLength') <> 'number' then return false; end if;
          max_length := (constraints->>'maxLength')::numeric;
          if max_length < 0 or max_length <> trunc(max_length) or max_length > 2147483647 then return false; end if;
        else
          max_length := null;
        end if;
        if min_length is not null and max_length is not null and min_length > max_length then return false; end if;
        if constraints ? 'allowedCharacters' and jsonb_typeof(constraints->'allowedCharacters') <> 'string' then return false; end if;
        if constraints ? 'allowSpaces' and jsonb_typeof(constraints->'allowSpaces') <> 'boolean' then return false; end if;
      end if;
    elsif rule_type = 'select' then
      if rule ? 'constraints' or not (rule ? 'options')
         or (rule - 'key' - 'label' - 'type' - 'required' - 'options') <> '{}'::jsonb
         or jsonb_typeof(rule->'options') <> 'array'
         or jsonb_array_length(rule->'options') = 0 then
        return false;
      end if;
      seen_options := '{}'::text[];
      for option_value in select value from jsonb_array_elements(rule->'options') as options(value) loop
        if jsonb_typeof(option_value) <> 'string' or btrim(option_value #>> '{}', trim_characters) = ''
           or option_value #>> '{}' = any(seen_options) then
          return false;
        end if;
        seen_options := array_append(seen_options, option_value #>> '{}');
      end loop;
    else
      return false;
    end if;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;
revoke all on function private.valid_customization_rules(jsonb) from public, anon, authenticated;
grant execute on function private.valid_customization_rules(jsonb) to authenticated, service_role;

alter table public.products drop constraint if exists products_product_type_check;
alter table public.products add constraint products_product_type_check
  check ("productType" in ('digital', 'physical'));
alter table public.products drop constraint if exists products_type_fields_check;
alter table public.products add constraint products_type_fields_check check (
  ("productType" = 'digital' and grade is not null and term is not null and year is not null
    and "resourceFormat" is not null and "weightGrams" is null and "lengthMm" is null
    and "widthMm" is null and "heightMm" is null and "customizationRules" = '[]'::jsonb)
  or
  ("productType" = 'physical'
    and jsonb_typeof("purchasedFiles") = 'array' and jsonb_array_length("purchasedFiles") = 0)
);
alter table public.products drop constraint if exists products_physical_units_check;
alter table public.products add constraint products_physical_units_check check (
  ("weightGrams" is null or "weightGrams" > 0)
  and ("lengthMm" is null or "lengthMm" > 0)
  and ("widthMm" is null or "widthMm" > 0)
  and ("heightMm" is null or "heightMm" > 0)
);
alter table public.products drop constraint if exists products_customization_rules_check;
alter table public.products add constraint products_customization_rules_check
  check (private.valid_customization_rules("customizationRules"));

-- Option definitions and prices are publishable content. Stock is kept in a
-- separate operational table so inventory changes never alter live content.
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  "productId" uuid not null references public.products(id) on delete cascade,
  sku text,
  "optionValues" jsonb not null default '{}'::jsonb,
  "unitPriceZar" numeric(10,2),
  "weightGrams" integer,
  "lengthMm" integer,
  "widthMm" integer,
  "heightMm" integer,
  active boolean not null default true,
  "sortOrder" integer not null default 0,
  "updatedAt" timestamptz not null default now(),
  live jsonb,
  constraint product_variants_options_object check (jsonb_typeof("optionValues") = 'object'),
  constraint product_variants_price_positive check ("unitPriceZar" is null or "unitPriceZar" > 0),
  constraint product_variants_dimensions_positive check (
    ("weightGrams" is null or "weightGrams" > 0)
    and ("lengthMm" is null or "lengthMm" > 0)
    and ("widthMm" is null or "widthMm" > 0)
    and ("heightMm" is null or "heightMm" > 0)
  )
);
create unique index if not exists product_variants_product_sku_unique
  on public.product_variants ("productId", sku) where sku is not null;
create index if not exists product_variants_product_id_idx
  on public.product_variants ("productId", "sortOrder", id);

create table if not exists public.product_inventory (
  "variantId" uuid primary key references public.product_variants(id) on delete cascade,
  "onHand" integer not null default 0 check ("onHand" >= 0),
  "updatedAt" timestamptz not null default now()
);

-- Default privileges may be broader on an existing Supabase project. Reset
-- ACLs for these two new tables before granting only the intended operators.
revoke all on public.product_variants, public.product_inventory from public, anon, authenticated, service_role;

create or replace function private.guard_physical_product_type_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old."productType" is distinct from new."productType" then
    -- Product/order history resolves through the current product row. Keeping
    -- this immutable prevents a paid digital order from being reinterpreted as
    -- a physical SKU with no downloadable files.
    raise exception 'Product type is immutable. Create a new product to use a different type.';
  end if;
  return new;
end;
$$;
drop trigger if exists products_guard_physical_type_change on public.products;
create trigger products_guard_physical_type_change
  before update of "productType" on public.products
  for each row execute function private.guard_physical_product_type_change();

create or replace function private.guard_physical_variant_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old."productId" is distinct from new."productId" then
    raise exception 'Variant product is immutable. Create a new variant for a different product.';
  end if;
  if not exists (
    select 1 from public.products p
    where p.id = new."productId" and p."productType" = 'physical'
  ) then
    raise exception 'Variants can only belong to physical products.';
  end if;
  return new;
end;
$$;
drop trigger if exists product_variants_guard_parent on public.product_variants;
create trigger product_variants_guard_parent
  before insert or update of "productId" on public.product_variants
  for each row execute function private.guard_physical_variant_parent();

create or replace function private.guard_physical_bundle_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.products p
    where p.id = new."productId" and p."productType" = 'physical'
  ) then
    raise exception 'Bundles can only contain digital products.';
  end if;
  return new;
end;
$$;
drop trigger if exists bundle_products_guard_digital_member on public.bundle_products;
create trigger bundle_products_guard_digital_member
  before insert or update of "productId" on public.bundle_products
  for each row execute function private.guard_physical_bundle_member();

create or replace function private.guard_product_variant_publish_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.live := null;
  else
    new.live := old.live;
  end if;
  return new;
end;
$$;
drop trigger if exists product_variants_guard_publish on public.product_variants;
create trigger product_variants_guard_publish
  before insert or update on public.product_variants
  for each row execute function private.guard_product_variant_publish_columns();

create or replace function private.queue_product_variant_content_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  product_id uuid;
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op = 'DELETE' then product_id := old."productId"; else product_id := new."productId"; end if;
  update public.products
    set status = 'queued'
    where id = product_id and status = 'published';
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists product_variants_queue_parent on public.product_variants;
create trigger product_variants_queue_parent
  after insert or update or delete on public.product_variants
  for each row execute function private.queue_product_variant_content_change();

create or replace function private.create_product_inventory_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.product_inventory ("variantId") values (new.id)
  on conflict ("variantId") do nothing;
  return new;
end;
$$;
drop trigger if exists product_variants_create_inventory on public.product_variants;
create trigger product_variants_create_inventory
  after insert on public.product_variants
  for each row execute function private.create_product_inventory_row();

drop trigger if exists product_variants_updated_at on public.product_variants;
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
drop trigger if exists product_inventory_updated_at on public.product_inventory;
create trigger product_inventory_updated_at before update on public.product_inventory
  for each row execute function public.set_updated_at();

-- Existing publish_site_content() already snapshots each product through
-- private.live_copy(to_jsonb(product)). This extension snapshots all active
-- variants in the same transaction and leaves stock rows untouched.
create or replace function private.guard_publish_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  row_data jsonb;
  product_id uuid;
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    if tg_table_name = 'products' then
      row_data := to_jsonb(new);
      product_id := (row_data->>'id')::uuid;
      if row_data->>'live' is null then
        update public.product_variants set live = null where "productId" = product_id;
      else
        update public.product_variants v
        set live = case when v.active then private.live_copy(to_jsonb(v)) else null end
        where v."productId" = product_id;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.live := null;
    new.published := false;
    new."publishedAt" := null;
    if new.status = 'published' then
      new.status := 'queued';
    end if;
    return new;
  end if;

  new.live := old.live;
  new.published := old.published;
  new."publishedAt" := old."publishedAt";
  if new.status = 'published'
     and (old.status <> 'published'
          or old.live is null
          or private.content_of(to_jsonb(new)) is distinct from private.content_of(old.live)) then
    new.status := 'queued';
  end if;
  return new;
end;
$$;

-- The row result remains byte-for-byte compatible with the previous public
-- digital catalogue. Missing productType in a pre-patch live JSON copy means
-- digital, preserving all existing digital listings until republished.
create or replace function private.published_products()
returns table (
  id uuid,
  slug text,
  title text,
  "shortDescription" text,
  "fullDescription" text,
  "priceZar" numeric(10,2),
  grade text,
  term text,
  year text,
  "resourceFormat" text,
  subjects text[],
  marks integer,
  "purchasedFiles" jsonb,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "galleryImages" jsonb,
  "previewPdfs" jsonb,
  status text,
  "publishedAt" timestamptz,
  "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz,
  "saleEndsAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.slug,
    l.title,
    l."shortDescription",
    l."fullDescription",
    l."priceZar",
    l.grade,
    l.term,
    l.year,
    l."resourceFormat",
    l.subjects,
    l.marks,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('id', file ->> 'id', 'label', file ->> 'label', 'filename', file ->> 'filename')
          order by file ->> 'id'
        )
        from jsonb_array_elements(coalesce(l."purchasedFiles", '[]'::jsonb)) as file
      ),
      '[]'::jsonb
    ),
    l.featured,
    true,
    l."sortOrder",
    l.seo,
    l.faqs,
    l."updatedAt",
    coalesce(l."galleryImages", '[]'::jsonb),
    coalesce(l."previewPdfs", '[]'::jsonb),
    'published'::text,
    p."publishedAt",
    l."salePriceZar",
    l."saleStartsAt",
    l."saleEndsAt"
  from public.products p
  cross join lateral jsonb_populate_record(null::public.products, p.live) l
  where p.live is not null and coalesce(l."productType", 'digital') = 'digital';
$$;

-- The low-level order writer is service-role-only, but retain a second guard
-- here so a future caller cannot bypass the live digital catalogue contract.
create or replace function public.create_pending_order(
  p_order_id uuid,
  p_payment_id uuid,
  p_reference text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_items jsonb,
  p_total_zar numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Order items are unavailable.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as line(item)
    where line.item->>'productType' = 'physical' or exists (
      select 1 from public.products p
      where p.slug = line.item->>'productSlug' and p."productType" = 'physical'
    )
  ) then
    raise exception 'Physical products cannot be ordered through the digital checkout.';
  end if;

  insert into public.orders (
    id, reference, "customerId", "customerName", "customerEmail", status, items, "totalZar", "paymentId"
  ) values (
    p_order_id, p_reference, p_customer_id, p_customer_name, p_customer_email, 'pending', p_items, p_total_zar, p_payment_id
  );
  insert into public.payments (id, "orderId", status, provider, reference, "amountZar")
  values (p_payment_id, p_order_id, 'pending', 'PayFast', p_reference, p_total_zar);
end;
$$;
revoke all on function public.create_pending_order(uuid, uuid, text, uuid, text, text, jsonb, numeric) from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid, uuid, text, uuid, text, text, jsonb, numeric) to service_role;

-- No client/public access: only admins may manage product configuration and
-- stock through the future admin feature; trusted server code uses service role.
alter table public.product_variants enable row level security;
alter table public.product_inventory enable row level security;
drop policy if exists "Admin manage product variants" on public.product_variants;
create policy "Admin manage product variants" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage product inventory" on public.product_inventory;
create policy "Admin manage product inventory" on public.product_inventory
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.product_variants, public.product_inventory to authenticated;
grant select, insert, update on public.product_variants, public.product_inventory to service_role;

commit;

-- BEGIN physical commerce journey
-- Physical commerce checkout, stock reservations, and fulfilment.
-- Apply after 2026-11-10-physical-product-foundation.sql. Safe to re-run.
begin;

-- Product pricing is published content, like customization rules and variant
-- options. Fixed pricing is the backward-compatible default.
alter table public.products
  add column if not exists "pricingMode" text not null default 'fixed',
  add column if not exists "pricingFieldKey" text,
  add column if not exists "billableCharacters" text;
alter table public.products alter column "pricingMode" set default 'fixed';
update public.products set "pricingMode" = 'fixed' where "pricingMode" is null;
alter table public.products alter column "pricingMode" set not null;
create or replace function private.valid_physical_pricing(
  product_type text, pricing_mode text, pricing_field_key text, billable_characters text, rules jsonb
)
returns boolean
language sql immutable set search_path = '' as $$
  select case
    when product_type = 'digital' then pricing_mode = 'fixed' and pricing_field_key is null and billable_characters is null
    when product_type = 'physical' and pricing_mode = 'fixed' then pricing_field_key is null and billable_characters is null
    when product_type = 'physical' and pricing_mode = 'per_character' then
      nullif(btrim(pricing_field_key), '') is not null
      and nullif(billable_characters, '') is not null
      and exists (
        select 1 from jsonb_array_elements(rules) rule
        where rule->>'key' = pricing_field_key and rule->>'type' = 'text' and rule->>'required' = 'true'
      )
    else false
  end;
$$;
revoke all on function private.valid_physical_pricing(text,text,text,text,jsonb) from public;
grant execute on function private.valid_physical_pricing(text,text,text,text,jsonb) to authenticated, service_role;
alter table public.products drop constraint if exists products_pricing_mode_check;
alter table public.products add constraint products_pricing_mode_check check (
  "pricingMode" in ('fixed', 'per_character')
  and private.valid_physical_pricing("productType", "pricingMode", "pricingFieldKey", "billableCharacters", "customizationRules")
);

-- Order fields are snapshots, so later product/shipping edits never rewrite
-- customer receipts or fulfilment history.
alter table public.orders
  add column if not exists "hasPhysical" boolean not null default false,
  add column if not exists "shippingZar" numeric(10,2) not null default 0,
  add column if not exists "shippingMethod" text,
  add column if not exists "shippingOptionId" text,
  add column if not exists delivery jsonb,
  add column if not exists "fulfillmentStatus" text not null default 'not_required',
  add column if not exists "trackingNumber" text,
  add column if not exists "trackingUrl" text,
  add column if not exists "reservationExpiresAt" timestamptz,
  add column if not exists "commerceFingerprint" text,
  add column if not exists "commerceBasketFingerprint" text;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'failed', 'payment_review'));
alter table public.orders drop constraint if exists orders_shipping_nonnegative;
alter table public.orders add constraint orders_shipping_nonnegative check ("shippingZar" >= 0);
alter table public.orders drop constraint if exists orders_fulfillment_status_check;
alter table public.orders add constraint orders_fulfillment_status_check
  check ("fulfillmentStatus" in ('not_required', 'unfulfilled', 'shipped', 'delivered', 'review'));
alter table public.orders drop constraint if exists orders_fulfillment_shape_check;
alter table public.orders add constraint orders_fulfillment_shape_check check (
  ("hasPhysical" and "fulfillmentStatus" in ('unfulfilled', 'shipped', 'delivered', 'review'))
  or (not "hasPhysical" and "fulfillmentStatus" = 'not_required' and "shippingZar" = 0 and delivery is null)
);
create index if not exists orders_commerce_fingerprint_idx
  on public.orders ("customerId", "commerceFingerprint", "placedAt" desc)
  where "commerceFingerprint" is not null;

-- Production schema remains disabled. Enabling any mode requires an explicit
-- late-payment rule; the local fixture supplies preview settings separately.
create table if not exists private.commerce_settings (
  singleton boolean primary key default true check (singleton),
  mode text not null default 'disabled' check (mode in ('disabled', 'local_preview', 'live')),
  "fixedShippingZar" numeric(10,2) not null default 0 check ("fixedShippingZar" >= 0),
  "shippingLabel" text not null default 'Physical delivery',
  "shippingMethodId" text not null default 'standard_za',
  "reservationTtlMinutes" integer not null default 15 check ("reservationTtlMinutes" between 1 and 1440),
  "physicalCouponPolicy" text not null default 'disabled' check ("physicalCouponPolicy" in ('disabled', 'digital_only')),
  "latePaymentPolicy" text,
  check ("latePaymentPolicy" is null or "latePaymentPolicy" = 're_reserve_or_review'),
  check (mode = 'disabled' or "latePaymentPolicy" is not distinct from 're_reserve_or_review')
);
alter table private.commerce_settings drop constraint if exists commerce_enabled_policy;
alter table private.commerce_settings add constraint commerce_enabled_policy check(mode='disabled' or "latePaymentPolicy" is not distinct from 're_reserve_or_review');
insert into private.commerce_settings (singleton) values (true) on conflict (singleton) do nothing;
revoke all on private.commerce_settings from public, anon, authenticated, service_role;

-- Customer cart lines and inventory reservations are not directly exposed to
-- anonymous callers. Reservations are mutated only by trusted RPCs/triggers.
create table if not exists public.physical_cart_items (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references auth.users(id) on delete cascade,
  "productSlug" text not null,
  "variantId" uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 2147483647),
  customizations jsonb not null default '{}'::jsonb check (jsonb_typeof(customizations) = 'object'),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create unique index if not exists physical_cart_items_identity_unique
  on public.physical_cart_items ("userId", "productSlug", "variantId", customizations);
create index if not exists physical_cart_items_user_idx
  on public.physical_cart_items ("userId", "updatedAt" desc);
alter table public.physical_cart_items enable row level security;
revoke all on public.physical_cart_items from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.physical_cart_items to authenticated;
drop policy if exists "Customer reads own physical cart" on public.physical_cart_items;
create policy "Customer reads own physical cart" on public.physical_cart_items
  for select to authenticated using ("userId" = auth.uid());
drop policy if exists "Customer inserts own physical cart" on public.physical_cart_items;
create policy "Customer inserts own physical cart" on public.physical_cart_items
  for insert to authenticated with check ("userId" = auth.uid());
drop policy if exists "Customer updates own physical cart" on public.physical_cart_items;
create policy "Customer updates own physical cart" on public.physical_cart_items
  for update to authenticated using ("userId" = auth.uid()) with check ("userId" = auth.uid());
drop policy if exists "Customer deletes own physical cart" on public.physical_cart_items;
create policy "Customer deletes own physical cart" on public.physical_cart_items
  for delete to authenticated using ("userId" = auth.uid());

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  "orderId" uuid not null references public.orders(id) on delete restrict,
  "variantId" uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  state text not null default 'held' check (state in ('held', 'committed', 'released')),
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("orderId", "variantId")
);
create index if not exists inventory_reservations_active_variant_idx
  on public.inventory_reservations ("variantId", "expiresAt") where state = 'held';
alter table public.inventory_reservations enable row level security;
revoke all on public.inventory_reservations from public, anon, authenticated, service_role;

-- Minimal safe readiness context; private settings remain private.
create or replace function private.commerce_public_context()
returns table (enabled boolean, "localPreview" boolean)
language sql stable security definer set search_path = '' as $$
  select s.mode <> 'disabled', s.mode = 'local_preview'
  from private.commerce_settings s where s.singleton;
$$;
revoke all on function private.commerce_public_context() from public;
grant execute on function private.commerce_public_context() to anon, authenticated, service_role;
create or replace view public.commerce_public_context
with (security_invoker = on) as select * from private.commerce_public_context();
grant select on public.commerce_public_context to anon, authenticated, service_role;

-- Database-side validation mirrors the shared commerce contract. The server
-- repeats these checks for good UX; these functions are the price/stock trust
-- boundary.
create or replace function private.valid_customization_values(rules jsonb, submitted_values jsonb)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  rule jsonb;
  value_text text;
  rule_key text;
  rule_type text;
  constraints jsonb;
  allowed text;
  allow_spaces boolean;
  character_index integer;
  character text;
begin
  if rules is null or submitted_values is null or not private.valid_customization_rules(rules) or jsonb_typeof(submitted_values) <> 'object' then return false; end if;
  for rule in select value from jsonb_array_elements(rules) as r(value) loop
    rule_key := rule->>'key';
    rule_type := rule->>'type';
    if not (submitted_values ? rule_key) then
      if (rule->>'required')::boolean then return false; end if;
      continue;
    end if;
    if jsonb_typeof(submitted_values->rule_key) <> 'string' then return false; end if;
    value_text := submitted_values->>rule_key;
    if (rule->>'required')::boolean and value_text = '' then return false; end if;
    if rule_type = 'select' then
      if not (rule->'options' ? value_text) then return false; end if;
      continue;
    end if;
    constraints := rule->'constraints';
    if constraints is null then constraints := '{}'::jsonb; end if;
    if constraints ? 'minLength' and char_length(value_text) < (constraints->>'minLength')::integer then return false; end if;
    if constraints ? 'maxLength' and char_length(value_text) > (constraints->>'maxLength')::integer then return false; end if;
    allowed := case when constraints ? 'allowedCharacters' then constraints->>'allowedCharacters' else null end;
    allow_spaces := coalesce((constraints->>'allowSpaces')::boolean, false);
    for character_index in 1..char_length(value_text) loop
      character := substr(value_text, character_index, 1);
      if character = ' ' and not allow_spaces then return false; end if;
      if allowed is not null and position(character in allowed) = 0 and not (character = ' ' and allow_spaces) then return false; end if;
    end loop;
  end loop;
  if exists (
    select 1 from jsonb_object_keys(submitted_values) submitted(key)
    where not exists (select 1 from jsonb_array_elements(rules) as r(value) where r.value->>'key' = submitted.key)
  ) then return false; end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_customization_values(jsonb,jsonb) from public, anon, authenticated, service_role;

-- Public physical rows have an explicit direct-column contract. Variants only
-- expose availability, never on-hand counts or active reservation totals.
-- Later patches widen this row; drop + create keeps every replay order valid.
drop function if exists private.published_physical_products() cascade;
create function private.published_physical_products()
returns table (
  id uuid, slug text, title text, "shortDescription" text, "fullDescription" text,
  "productType" text, "priceZar" numeric(10,2), "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz, "saleEndsAt" timestamptz, "pricingMode" text,
  "pricingFieldKey" text, "billableCharacters" text, "customizationRules" jsonb,
  "galleryImages" jsonb, variants jsonb, published boolean
)
language sql stable security definer set search_path = '' as $$
  select l.id, l.slug, l.title, l."shortDescription", l."fullDescription", 'physical'::text,
    l."priceZar", l."salePriceZar", l."saleStartsAt", l."saleEndsAt", l."pricingMode",
    l."pricingFieldKey", l."billableCharacters", l."customizationRules", l."galleryImages",
    variants.rows, true
  from private.commerce_settings settings
  join public.products p on p.live is not null
  cross join lateral jsonb_populate_record(null::public.products, p.live) l
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'sku', v.sku, 'optionValues', v."optionValues",
      'unitPriceZar', v."unitPriceZar",
      'available', greatest(coalesce(i."onHand", 0) - coalesce(held.quantity, 0), 0) > 0
    ) order by v."sortOrder", v.id) as rows
    from public.product_variants current_variant
    cross join lateral jsonb_populate_record(null::public.product_variants, current_variant.live) v
    left join public.product_inventory i on i."variantId" = current_variant.id
    left join lateral (
      select sum(r.quantity)::integer as quantity
      from public.inventory_reservations r
      where r."variantId" = current_variant.id and r.state = 'held' and r."expiresAt" > now()
    ) held on true
    where current_variant."productId" = p.id and current_variant.live is not null and v.active
  ) variants
  where settings.singleton and settings.mode <> 'disabled'
    and l."productType" = 'physical' and p.published
    and jsonb_typeof(l."purchasedFiles") = 'array' and jsonb_array_length(l."purchasedFiles") = 0
    and private.valid_physical_pricing(l."productType", l."pricingMode", l."pricingFieldKey", l."billableCharacters", l."customizationRules") and variants.rows is not null;
$$;
revoke all on function private.published_physical_products() from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.published_physical_products() to anon, authenticated, service_role;
create or replace view public.catalog_physical_products
with (security_invoker = on) as select * from private.published_physical_products();
grant select on public.catalog_physical_products to anon, authenticated, service_role;

-- Short-lived stock holds are released lazily on each commerce operation; the
-- public availability calculation ignores expired holds immediately.
create or replace function private.release_expired_inventory_reservations(at_time timestamptz default now())
returns integer
language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.inventory_reservations
    set state = 'released', "updatedAt" = at_time
    where state = 'held' and "expiresAt" <= at_time;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function private.release_expired_inventory_reservations(timestamptz) from public, anon, authenticated, service_role;

create or replace function private.valid_delivery_details(value jsonb)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare phone text;
begin
  if value is null or jsonb_typeof(value) <> 'object' then return false; end if;
  if exists (
    select 1 from jsonb_object_keys(value) supplied(key)
    where supplied.key not in ('recipientName','phone','addressLine1','addressLine2','suburb','city','province','postalCode','country')
  ) then return false; end if;
  if exists(select 1 from unnest(array['recipientName','phone','addressLine1','suburb','city','province','postalCode','country']) k where jsonb_typeof(value->k) is distinct from 'string') then return false; end if;
  if value->>'country' is distinct from 'ZA' or coalesce(value->>'postalCode','') !~ '^\d{4}$' then return false; end if;
  foreach phone in array array[value->>'recipientName', value->>'addressLine1', value->>'suburb', value->>'city', value->>'province'] loop
    if phone is null or btrim(phone) = '' or char_length(phone) > 200 then return false; end if;
  end loop;
  if value ? 'addressLine2' and (jsonb_typeof(value->'addressLine2') <> 'string' or char_length(value->>'addressLine2') > 200) then return false; end if;
  phone := regexp_replace(coalesce(value->>'phone',''), '[[:space:]()-]', '', 'g');
  return phone ~ '^(0[0-9]{9}|\+27[0-9]{9})$';
end;
$$;
revoke all on function private.valid_delivery_details(jsonb) from public, anon, authenticated, service_role;

create or replace function private.build_commerce_quote(
  p_customer_id uuid,
  p_digital_slugs text[],
  p_physical_items jsonb,
  p_coupon_code text,
  p_delivery jsonb,
  p_shipping_option_id text
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  settings private.commerce_settings%rowtype;
  digital_slugs text[];
  digital_quote jsonb := '{}'::jsonb;
  digital_items jsonb := '[]'::jsonb;
  physical_items jsonb := '[]'::jsonb;
  line jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  item_id uuid;
  product_slug text;
  variant_id uuid;
  quantity numeric;
  customizations jsonb;
  unit_rate numeric;
  billable_count integer;
  line_total numeric;
  physical_subtotal numeric := 0;
  subtotal numeric;
  discount numeric := 0;
  shipping numeric := 0;
  coupon_code text := nullif(upper(btrim(p_coupon_code)), '');
  coupon_id uuid;
  has_physical boolean;
  line_ids uuid[] := '{}'::uuid[];
  requested_variants uuid[] := '{}'::uuid[];
  requested_quantities integer[] := '{}'::integer[];
  variant_index integer;
  available integer;
  line_count integer;
  index_value integer;
begin
  select * into settings from private.commerce_settings where singleton;
  if not found then raise exception 'Commerce settings are unavailable.'; end if;
  if not exists (select 1 from public.users u where u.id = p_customer_id) then
    raise exception 'Customer account not found.';
  end if;
  if p_physical_items is null then p_physical_items := '[]'::jsonb; end if;
  if jsonb_typeof(p_physical_items) <> 'array' then raise exception 'Physical cart items must be an array.'; end if;
  select coalesce(array_agg(distinct slug order by slug), '{}'::text[]) into digital_slugs
  from unnest(coalesce(p_digital_slugs, '{}'::text[])) as slugs(slug);
  if exists (select 1 from unnest(digital_slugs) slug where nullif(btrim(slug), '') is null) then
    raise exception 'Digital product slugs must be non-empty.';
  end if;
  select count(*) > 0 into has_physical from jsonb_array_elements(p_physical_items);
  if cardinality(digital_slugs) = 0 and not has_physical then raise exception 'Cart is empty.'; end if;
  if has_physical and settings.mode = 'disabled' then raise exception 'Physical checkout is unavailable.'; end if;
  if has_physical and coupon_code is not null then
    if settings."physicalCouponPolicy" = 'disabled' then
      raise exception 'Discount codes are unavailable when your basket contains physical products.';
    elsif cardinality(digital_slugs) = 0 then
      raise exception 'This discount code applies to digital products only.';
    end if;
  end if;

  if cardinality(digital_slugs) > 200 or jsonb_array_length(p_physical_items) > 200 then raise exception 'Too many cart items.'; end if;
  if cardinality(digital_slugs) > 0 then
    digital_quote := public.quote_promotional_order(p_customer_id, digital_slugs, coupon_code);
    select coalesce(jsonb_agg(e || jsonb_build_object('productType','digital','quantity',1,'unitPriceZar',(e->>'priceZar')::numeric)),'[]'::jsonb) into digital_items from jsonb_array_elements(coalesce(digital_quote->'items','[]'::jsonb)) e;
    discount := coalesce((digital_quote->>'discountZar')::numeric, 0);
    coupon_id := nullif(digital_quote->>'couponId', '')::uuid;
  elsif coupon_code is not null then
    raise exception 'This discount code applies to digital products only.';
  end if;

  line_count := jsonb_array_length(p_physical_items);
  for index_value in 0..line_count - 1 loop
    line := p_physical_items->index_value;
    if jsonb_typeof(line) <> 'object'
       or not (line ? 'id' and line ? 'productSlug' and line ? 'variantId' and line ? 'quantity')
       or exists (
         select 1 from jsonb_object_keys(line) supplied(key)
         where supplied.key not in ('id','productSlug','variantId','quantity','customizations')
       ) then
      raise exception 'Each physical cart line must contain an id, productSlug, variantId, quantity, and customizations.';
    end if;
    begin
      item_id := (line->>'id')::uuid;
      variant_id := (line->>'variantId')::uuid;
      quantity := (line->>'quantity')::numeric;
    exception when others then
      raise exception 'Physical cart line identifiers or quantity are invalid.';
    end;
    product_slug := line->>'productSlug';
    customizations := coalesce(line->'customizations', '{}'::jsonb);
    if nullif(btrim(product_slug), '') is null or jsonb_typeof(customizations) <> 'object'
       or jsonb_typeof(line->'quantity')<>'number' or item_id is null or variant_id is null or quantity is null or quantity <> trunc(quantity) or quantity < 1 or quantity > 2147483647 then
      raise exception 'Physical cart line identifiers, customizations, or quantity are invalid.';
    end if;
    if item_id = any(line_ids) then raise exception 'Duplicate physical cart line ids are not allowed.'; end if;
    line_ids := array_append(line_ids, item_id);

    select l.* into product_row
    from public.products p
    cross join lateral jsonb_populate_record(null::public.products, p.live) l
    where p.live is not null and p.published and l."productType" = 'physical'
      and l.slug = product_slug and jsonb_array_length(coalesce(l."purchasedFiles", '[]'::jsonb)) = 0;
    if not found or not private.valid_physical_pricing(
      product_row."productType", product_row."pricingMode", product_row."pricingFieldKey",
      product_row."billableCharacters", product_row."customizationRules"
    ) then raise exception 'One or more physical products are unavailable.'; end if;
    select l.* into variant_row
    from public.product_variants v
    cross join lateral jsonb_populate_record(null::public.product_variants, v.live) l
    where v.id = variant_id and v."productId" = product_row.id and v.live is not null
      and coalesce((v.live->>'active')::boolean, false);
    if not found then raise exception 'One or more selected product options are unavailable.'; end if;
    if not private.valid_customization_values(product_row."customizationRules", customizations) then
      raise exception 'Complete the product customization using the allowed values.';
    end if;

    unit_rate := case when variant_row."unitPriceZar" is not null
      then variant_row."unitPriceZar"
      else public.promotion_price(product_row."priceZar", product_row."salePriceZar", product_row."saleStartsAt", product_row."saleEndsAt", now())
    end;
    if product_row."pricingMode" = 'per_character' then
      billable_count := char_length(customizations->>product_row."pricingFieldKey")
        - char_length(translate(customizations->>product_row."pricingFieldKey", product_row."billableCharacters", ''));
      if billable_count < 1 then raise exception 'Enter a name containing a billable letter.'; end if;
      unit_rate := unit_rate * billable_count;
    end if;
    unit_rate := round(unit_rate, 2);
    if not (unit_rate > 0 and unit_rate < 'Infinity'::numeric) then raise exception 'Physical item prices must be greater than zero.'; end if;
    line_total := round(unit_rate * quantity, 2);
    physical_subtotal := physical_subtotal + line_total;
    physical_items := physical_items || jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid(), 'productSlug', product_row.slug, 'title', product_row.title,
      'productKind', 'Physical', 'productType', 'physical', 'quantity', quantity::integer,
      'unitPriceZar', unit_rate, 'priceZar', line_total,
      'customizations', customizations, 'variantId', variant_id,
      'optionValues', variant_row."optionValues", 'cartLineId', item_id
    ));

    variant_index := array_position(requested_variants, variant_id);
    if variant_index is null then
      requested_variants := array_append(requested_variants, variant_id);
      requested_quantities := array_append(requested_quantities, quantity::integer);
    else
      requested_quantities[variant_index] := requested_quantities[variant_index] + quantity::integer;
    end if;
  end loop;

  for index_value in 1..coalesce(cardinality(requested_variants), 0) loop
    select greatest(coalesce(i."onHand",0) - coalesce((
      select sum(r.quantity)::integer from public.inventory_reservations r
      where r."variantId" = requested_variants[index_value] and r.state = 'held' and r."expiresAt" > now()
    ),0),0) into available
    from public.product_inventory i where i."variantId" = requested_variants[index_value];
    if coalesce(available,0) < requested_quantities[index_value] then
      raise exception 'One or more selected product options are no longer available.';
    end if;
  end loop;

  if has_physical then
    if p_shipping_option_id is not null and p_shipping_option_id <> settings."shippingMethodId" then
      raise exception 'The selected shipping option is unavailable.';
    end if;
    shipping := settings."fixedShippingZar";
  end if;
  subtotal := coalesce((digital_quote->>'subtotalZar')::numeric, 0) + physical_subtotal;
  if subtotal - discount + shipping <= 0 then raise exception 'Order total must be greater than zero.'; end if;
  return jsonb_build_object(
    'items', digital_items || physical_items,
    'subtotalZar', round(subtotal,2), 'discountZar', round(discount,2),
    'shippingZar', round(shipping,2), 'totalZar', round(subtotal-discount+shipping,2),
    'couponCode', nullif(digital_quote->>'couponCode',''), 'hasPhysical', has_physical,
    'shippingOption', case when has_physical then jsonb_build_object('id',settings."shippingMethodId",'label',settings."shippingLabel",'amountZar',settings."fixedShippingZar") else null end,
    'localPreview', settings.mode = 'local_preview', '_couponId', coupon_id
  );
end;
$$;
revoke all on function private.build_commerce_quote(uuid,text[],jsonb,text,jsonb,text) from public, anon, authenticated, service_role;

-- Transaction identity covers delivery/configuration as well as customized lines.
create or replace function private.commerce_fingerprint(digital text[], physical jsonb, code text, delivery jsonb, shipping text)
returns text language sql immutable set search_path = '' as $$
 select md5(jsonb_build_array(
   (select coalesce(jsonb_agg(s order by s),'[]'::jsonb) from (select distinct unnest(digital) s) x),
   (select coalesce(jsonb_agg(e order by e->>'id'),'[]'::jsonb) from jsonb_array_elements(physical) e),
   upper(btrim(coalesce(code,''))),delivery,shipping)::text);
$$;
revoke all on function private.commerce_fingerprint(text[],jsonb,text,jsonb,text) from public,anon,authenticated,service_role;

create or replace function public.quote_commerce_order(
 p_customer_id uuid,p_digital_slugs text[],p_physical_items jsonb,p_coupon_code text,p_delivery jsonb,p_shipping_option_id text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare purchase public.orders%rowtype; fingerprint text; settings private.commerce_settings%rowtype;
begin
 select * into settings from private.commerce_settings where singleton;
 fingerprint:=private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),coalesce(p_physical_items,'[]'::jsonb),p_coupon_code,null,null);
 select * into purchase from public.orders where "customerId"=p_customer_id and "commerceBasketFingerprint"=fingerprint and status='pending' order by "placedAt" desc limit 1;
 if found then
  return jsonb_build_object('items',purchase.items,'subtotalZar',purchase."subtotalZar",'discountZar',purchase."discountZar",'totalZar',purchase."totalZar",'shippingZar',purchase."shippingZar",'couponCode',purchase."couponCode",'hasPhysical',purchase."hasPhysical",'localPreview',settings.mode='local_preview','shippingOption',case when purchase."hasPhysical" then jsonb_build_object('id',purchase."shippingOptionId",'label',purchase."shippingMethod",'amountZar',purchase."shippingZar") else null end);
 end if;
 return private.build_commerce_quote(p_customer_id,p_digital_slugs,p_physical_items,p_coupon_code,p_delivery,p_shipping_option_id)-'_couponId';
end; $$;
revoke all on function public.quote_commerce_order(uuid,text[],jsonb,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.quote_commerce_order(uuid,text[],jsonb,text,jsonb,text) to service_role;

create or replace function public.create_commerce_order(
 p_customer_id uuid,p_digital_slugs text[],p_physical_items jsonb,p_coupon_code text,p_delivery jsonb,
 p_shipping_option_id text,p_reference text,p_expected_total_zar numeric
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 settings private.commerce_settings%rowtype; purchase public.orders%rowtype; customer public.users%rowtype;
 fingerprint text; quote jsonb; oid uuid := gen_random_uuid(); pid uuid := gen_random_uuid(); expiry timestamptz;
 coupon_id uuid; variant uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('commerce:'||p_customer_id::text,0));
 select * into settings from private.commerce_settings where singleton;
 if p_physical_items is null then p_physical_items := '[]'::jsonb; end if;
 if jsonb_typeof(p_physical_items)<>'array' then raise exception 'Physical items must be an array.'; end if;
 fingerprint := private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,p_delivery,p_shipping_option_id);
 -- Retry the identical accepted basket without repricing or reserving twice.
 select * into purchase from public.orders where "customerId"=p_customer_id and "commerceBasketFingerprint"=private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,null,null)
   and status='pending' order by "placedAt" desc limit 1 for update;
 if found then
   if purchase."hasPhysical" then
     if settings.mode='disabled' then raise exception 'Physical checkout is unavailable.'; end if;
     if not private.valid_delivery_details(p_delivery) then raise exception 'Complete your South African delivery details.'; end if;
     if p_shipping_option_id is distinct from purchase."shippingOptionId" then raise exception 'Choose the delivery option before checkout.'; end if;
     update public.orders set delivery=p_delivery,"commerceFingerprint"=fingerprint where id=purchase.id;
   end if;
   if p_expected_total_zar is null or purchase."totalZar" <> p_expected_total_zar then raise exception 'Prices changed. Review the updated total before paying.'; end if;
   if purchase."hasPhysical" and purchase."reservationExpiresAt"<=now() then
     for variant in select "variantId" from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
       perform 1 from public.product_inventory where "variantId"=variant for update;
       if coalesce((select i."onHand"-coalesce((select sum(r.quantity) from public.inventory_reservations r where r."variantId"=variant and r."orderId"<>purchase.id and r.state='held' and r."expiresAt">now()),0)
           from public.product_inventory i where i."variantId"=variant),0) < (select quantity from public.inventory_reservations where "orderId"=purchase.id and "variantId"=variant) then
         raise exception 'One or more selected product options are no longer available. Cancel this checkout and update your cart.';
       end if;
     end loop;
     expiry:=now()+make_interval(mins=>settings."reservationTtlMinutes");
     update public.inventory_reservations set state='held',"expiresAt"=expiry where "orderId"=purchase.id;
     update public.orders set "reservationExpiresAt"=expiry where id=purchase.id;
     purchase."reservationExpiresAt":=expiry;
   end if;
   return jsonb_build_object('orderId',purchase.id,'paymentId',purchase."paymentId",'reference',purchase.reference,
    'items',purchase.items,'subtotalZar',purchase."subtotalZar",'discountZar',purchase."discountZar",'totalZar',purchase."totalZar",
    'shippingZar',purchase."shippingZar",'couponCode',purchase."couponCode",'hasPhysical',purchase."hasPhysical",
    'localPreview',settings.mode='local_preview','reservationExpiresAt',purchase."reservationExpiresAt",
    'shippingOption',case when purchase."hasPhysical" then jsonb_build_object('id',purchase."shippingOptionId",'label',purchase."shippingMethod",'amountZar',purchase."shippingZar") else null end);
 end if;
 -- Serialize inventory with payment completion and stock edits in UUID order.
 for variant in select distinct (e->>'variantId')::uuid from jsonb_array_elements(p_physical_items) e order by 1 loop
   perform 1 from public.product_inventory where "variantId"=variant for update;
 end loop;
 -- Expired holds stop counting in availability; avoid global writes across unrelated stock locks.
 if nullif(btrim(p_coupon_code),'') is not null then
   select id into coupon_id from public.coupons where code=upper(btrim(p_coupon_code));
   if coupon_id is not null then perform pg_advisory_xact_lock(hashtextextended(coupon_id::text||':'||p_customer_id::text,0)); perform 1 from public.coupons where id=coupon_id for share; end if;
 end if;
 quote := private.build_commerce_quote(p_customer_id,p_digital_slugs,p_physical_items,p_coupon_code,p_delivery,p_shipping_option_id);
 if (quote->>'hasPhysical')::boolean and not private.valid_delivery_details(p_delivery) then raise exception 'Complete the recipient name, contact number and South African delivery address.'; end if;
 if (quote->>'hasPhysical')::boolean and p_shipping_option_id is distinct from settings."shippingMethodId" then raise exception 'Choose the delivery option before checkout.'; end if;
 if p_expected_total_zar is null or (quote->>'totalZar')::numeric <> p_expected_total_zar then raise exception 'Prices changed. Review the updated total before paying.'; end if;
 select * into customer from public.users where id=p_customer_id;
 expiry := now()+make_interval(mins=>settings."reservationTtlMinutes");
 insert into public.orders(id,reference,"customerId","customerName","customerEmail",status,items,"totalZar","paymentId","subtotalZar","discountZar","couponCode","couponId","hasPhysical","shippingZar","shippingMethod","shippingOptionId",delivery,"fulfillmentStatus","reservationExpiresAt","commerceFingerprint","commerceBasketFingerprint")
 values(oid,p_reference,p_customer_id,customer.name,customer.email,'pending',quote->'items',(quote->>'totalZar')::numeric,pid,
 (quote->>'subtotalZar')::numeric,(quote->>'discountZar')::numeric,quote->>'couponCode',(quote->>'_couponId')::uuid,
 (quote->>'hasPhysical')::boolean,(quote->>'shippingZar')::numeric,case when (quote->>'hasPhysical')::boolean then settings."shippingLabel" end,
 case when (quote->>'hasPhysical')::boolean then settings."shippingMethodId" end,case when (quote->>'hasPhysical')::boolean then p_delivery end,
 case when (quote->>'hasPhysical')::boolean then 'unfulfilled' else 'not_required' end,expiry,fingerprint,private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,null,null));
 insert into public.payments(id,"orderId",status,provider,reference,"amountZar") values(pid,oid,'pending',case when settings.mode='local_preview' then 'Simulation' else 'PayFast' end,p_reference,(quote->>'totalZar')::numeric);
 insert into public.inventory_reservations("orderId","variantId",quantity,"expiresAt")
 select oid,(e->>'variantId')::uuid,sum((e->>'quantity')::integer)::integer,expiry from jsonb_array_elements(quote->'items') e where e->>'productType'='physical' group by 2;
 if quote->>'_couponId' is not null then
   insert into public.coupon_redemptions("couponId","customerId","orderId") values((quote->>'_couponId')::uuid,p_customer_id,oid);
 end if;
 return (quote-'_couponId')||jsonb_build_object('orderId',oid,'paymentId',pid,'reference',p_reference,'reservationExpiresAt',expiry);
end; $$;
revoke all on function public.create_commerce_order(uuid,text[],jsonb,text,jsonb,text,text,numeric) from public,anon,authenticated;
grant execute on function public.create_commerce_order(uuid,text[],jsonb,text,jsonb,text,text,numeric) to service_role;

create or replace function private.release_commerce_order_holds() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='failed' then update public.inventory_reservations set state='released',"updatedAt"=now() where "orderId"=new.id and state='held'; end if;
 return new;
end; $$;
revoke all on function private.release_commerce_order_holds() from public,anon,authenticated,service_role;
drop trigger if exists orders_release_commerce_holds on public.orders;
create trigger orders_release_commerce_holds after update of status on public.orders for each row execute function private.release_commerce_order_holds();

create or replace function public.cancel_commerce_order(p_customer_id uuid,p_order_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare payment_id uuid; purchase public.orders%rowtype;
begin
 select "paymentId" into payment_id from public.orders where id=p_order_id and "customerId"=p_customer_id;
 if payment_id is null then return false; end if;
 perform 1 from public.payments where id=payment_id for update;
 select * into purchase from public.orders where id=p_order_id and "customerId"=p_customer_id for update;
 if purchase.status='failed' then return true; end if;
 if purchase.status<>'pending' then return false; end if;
 update public.payments set status='failed' where id=payment_id and status='pending';
 update public.orders set status='failed' where id=p_order_id and status='pending';
 return true;
end; $$;
revoke all on function public.cancel_commerce_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_commerce_order(uuid,uuid) to service_role;

create or replace function public.complete_commerce_payment(p_payment_id uuid,p_provider_payment_id text,p_amount_zar numeric)
returns text language plpgsql security definer set search_path='' as $$
declare payment public.payments%rowtype; purchase public.orders%rowtype; hold record; stock integer; held integer; can_fulfill boolean:=true;
begin
 if nullif(btrim(p_provider_payment_id),'') is null or p_amount_zar is null or p_amount_zar<=0 then return 'rejected'; end if;
 select * into payment from public.payments where id=p_payment_id for update;
 if not found then return 'rejected'; end if;
 select * into purchase from public.orders where id=payment."orderId" for update;
 if not found or purchase."paymentId" is distinct from payment.id or payment."amountZar"<>p_amount_zar or purchase."totalZar"<>p_amount_zar
  or payment.provider not in ('PayFast','Simulation') or payment.status not in ('pending','succeeded') or purchase.status not in ('pending','paid','fulfilled','payment_review')
  or (payment."pfPaymentId" is not null and payment."pfPaymentId"<>p_provider_payment_id)
  or exists(select 1 from public.payments where "pfPaymentId"=p_provider_payment_id and id<>p_payment_id) then return 'rejected'; end if;
 if payment.status='succeeded' and purchase.status in ('paid','fulfilled','payment_review') then return case when purchase.status='payment_review' then 'review' else 'duplicate' end; end if;
 for hold in select * from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
   select "onHand" into stock from public.product_inventory where "variantId"=hold."variantId" for update;
   select coalesce(sum(quantity),0)::integer into held from public.inventory_reservations where "variantId"=hold."variantId" and "orderId"<>purchase.id and state='held' and "expiresAt">now();
   if stock is null or stock-held<hold.quantity then can_fulfill:=false; end if;
 end loop;
 if purchase."hasPhysical" and not exists(select 1 from public.inventory_reservations where "orderId"=purchase.id) then can_fulfill:=false; end if;
 -- All stock rows are locked before deciding or deducting any line.
 if can_fulfill then
   for hold in select * from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
     update public.product_inventory set "onHand"="onHand"-hold.quantity where "variantId"=hold."variantId";
   end loop;
   update public.inventory_reservations set state='committed',"updatedAt"=now() where "orderId"=purchase.id;
 else
   update public.inventory_reservations set state='released',"updatedAt"=now() where "orderId"=purchase.id;
 end if;
 update public.payments set status='succeeded',"pfPaymentId"=p_provider_payment_id,"processedAt"=now() where id=p_payment_id;
 update public.orders set status=case when can_fulfill then 'paid' else 'payment_review' end,
  "fulfillmentStatus"=case when not "hasPhysical" then 'not_required' when can_fulfill then 'unfulfilled' else 'review' end where id=purchase.id;
 if can_fulfill then
   for hold in select (e->>'cartLineId')::uuid as line_id,(e->>'quantity')::integer as quantity from jsonb_array_elements(purchase.items) e where e->>'productType'='physical' loop
     delete from public.physical_cart_items where "userId"=purchase."customerId" and id=hold.line_id and quantity<=hold.quantity;
     update public.physical_cart_items set quantity=quantity-hold.quantity where "userId"=purchase."customerId" and id=hold.line_id;
   end loop;
 end if;
 return case when can_fulfill then 'processed' else 'review' end;
end; $$;
revoke all on function public.complete_commerce_payment(uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.complete_commerce_payment(uuid,text,numeric) to service_role;

-- Keep the established digital completion path; only new commerce orders delegate.
create or replace function public.complete_payfast_payment(
  p_payment_id uuid, p_pf_payment_id text, p_amount_zar numeric
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  payment public.payments%rowtype;
  purchase public.orders%rowtype;
  was_succeeded boolean;
begin
  if exists(select 1 from public.payments p join public.orders o on o.id=p."orderId" where p.id=p_payment_id and o."commerceFingerprint" is not null) then
    return public.complete_commerce_payment(p_payment_id,p_pf_payment_id,p_amount_zar);
  end if;
  if p_pf_payment_id is null or btrim(p_pf_payment_id) = '' or p_amount_zar is null or p_amount_zar <= 0 then
    return 'rejected';
  end if;
  select * into payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  select * into purchase from public.orders where id = payment."orderId" for update;
  if not found then raise exception 'Order not found'; end if;

  -- Never overwrite refunds, failed records, another transaction or a mismatched order.
  if payment.provider <> 'PayFast' or payment."amountZar" <> p_amount_zar or purchase."totalZar" <> p_amount_zar
    or purchase."paymentId" is distinct from payment.id
    or payment.status not in ('pending', 'succeeded') or purchase.status not in ('pending', 'paid', 'fulfilled')
    or (payment."pfPaymentId" is not null and payment."pfPaymentId" <> p_pf_payment_id)
    or exists (select 1 from public.payments where "pfPaymentId" = p_pf_payment_id and id <> payment.id)
  then return 'rejected'; end if;

  was_succeeded := payment.status = 'succeeded';
  if was_succeeded and (payment."processedAt" is null or payment."pfPaymentId" is null) then return 'rejected'; end if;
  if was_succeeded and purchase.status in ('paid', 'fulfilled') then return 'duplicate'; end if;

  if not was_succeeded then
    update public.payments set status = 'succeeded', "pfPaymentId" = p_pf_payment_id, "processedAt" = now()
      where id = payment.id;
  end if;
  if purchase.status = 'pending' then
    -- Includes the cart-clearing trigger. Any failure rolls back BOTH updates.
    update public.orders set status = 'paid' where id = purchase.id;
  end if;
  return case when was_succeeded then 'recovered' else 'processed' end;
end;
$$;
revoke all on function public.complete_payfast_payment(uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.complete_payfast_payment(uuid,text,numeric) to service_role;

create or replace function public.set_order_fulfillment(p_order_id uuid,p_status text,p_tracking_number text,p_tracking_url text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare purchase public.orders%rowtype;
begin
 if not public.is_admin() then raise exception 'Administrator access is required.' using errcode='42501'; end if;
 select * into purchase from public.orders where id=p_order_id for update;
 if not found or not purchase."hasPhysical" or purchase.status not in ('paid','fulfilled') then raise exception 'Only paid physical orders can be fulfilled.'; end if;
 if not ((purchase."fulfillmentStatus"='unfulfilled' and p_status='shipped') or (purchase."fulfillmentStatus"='shipped' and p_status='delivered')
    or (purchase."fulfillmentStatus"=p_status and p_status in ('shipped','delivered'))) then raise exception 'This fulfilment status change is not allowed.'; end if;
 if p_tracking_url is not null and p_tracking_url !~ '^https://[^[:space:]]+$' then raise exception 'Tracking links must use HTTPS.'; end if;
 if char_length(p_tracking_number)>100 or char_length(p_tracking_url)>2000 then raise exception 'Tracking details are too long.'; end if;
 update public.orders set "fulfillmentStatus"=p_status,"trackingNumber"=nullif(btrim(p_tracking_number),''),"trackingUrl"=nullif(p_tracking_url,''),
 status=case when p_status='delivered' then 'fulfilled' else 'paid' end where id=p_order_id returning * into purchase;
 return to_jsonb(purchase);
end; $$;
revoke all on function public.set_order_fulfillment(uuid,text,text,text) from public,anon,service_role;
grant execute on function public.set_order_fulfillment(uuid,text,text,text) to authenticated;

-- Admin saves are atomic. Counts only change through explicit compare-and-set adjustments.
create or replace function public.save_physical_product(p_product jsonb,p_variants jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare product_id uuid; row public.products%rowtype; allowed text[]; clean jsonb; v jsonb; vid uuid; current_v public.product_variants%rowtype;
 current_stock integer; desired integer; hold_count integer; option_data jsonb; result jsonb;
begin
 if not public.is_admin() then raise exception 'Administrator access is required.' using errcode='42501'; end if;
 if p_product->>'productType' is distinct from 'physical' or jsonb_typeof(p_variants)<>'array' then raise exception 'A physical product and its options are required.'; end if;
 product_id:=(p_product->>'id')::uuid;
 if product_id is null then raise exception 'Product id is required.'; end if;
 select * into row from public.products where id=product_id for update;
 if found and row."productType"<>'physical' then raise exception 'Product type cannot be changed.'; end if;
 -- Work from existing/default values while discarding every computed publication field.
 if row.id is null then
   insert into public.products(id,slug,title,"productType") values(product_id,p_product->>'slug',p_product->>'title','physical') returning * into row;
 end if;
 allowed:=array['slug','title','shortDescription','fullDescription','priceZar','salePriceZar','saleStartsAt','saleEndsAt','grade','term','year','resourceFormat','subjects','marks','galleryImages','previewPdfs','featured','sortOrder','seo','faqs','weightGrams','lengthMm','widthMm','heightMm','customizationRules','pricingMode','pricingFieldKey','billableCharacters','status'];
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into clean from jsonb_each(p_product) where key=any(allowed);
 row:=jsonb_populate_record(row,clean);
 update public.products set slug=row.slug,title=row.title,"shortDescription"=row."shortDescription","fullDescription"=row."fullDescription",
 "priceZar"=row."priceZar","salePriceZar"=row."salePriceZar","saleStartsAt"=row."saleStartsAt","saleEndsAt"=row."saleEndsAt",
 grade=row.grade,term=row.term,year=row.year,"resourceFormat"=row."resourceFormat",subjects=row.subjects,marks=row.marks,
 "galleryImages"=row."galleryImages","previewPdfs"=row."previewPdfs",featured=row.featured,"sortOrder"=row."sortOrder",seo=row.seo,faqs=row.faqs,
 "weightGrams"=row."weightGrams","lengthMm"=row."lengthMm","widthMm"=row."widthMm","heightMm"=row."heightMm",
 "customizationRules"=row."customizationRules","pricingMode"=row."pricingMode","pricingFieldKey"=row."pricingFieldKey","billableCharacters"=row."billableCharacters",status=row.status where id=product_id;
 for v in select e from jsonb_array_elements(p_variants) e order by e->>'id' loop
   vid:=(v->>'id')::uuid;
   if vid is null or (v->>'productId')::uuid is distinct from product_id then raise exception 'Product options must belong to this product.'; end if;
   select * into current_v from public.product_variants where id=vid for update;
   if found and current_v."productId"<>product_id then raise exception 'Product options cannot be moved.'; end if;
   option_data:=v->'optionValues';
   if jsonb_typeof(option_data)<>'object' or exists(select 1 from jsonb_each(option_data) where jsonb_typeof(value)<>'string' or nullif(btrim(key),'') is null or nullif(btrim(value#>>'{}'),'') is null) then raise exception 'Option choices must have a name and a value.'; end if;
   insert into public.product_variants(id,"productId",sku,"optionValues","unitPriceZar",active,"sortOrder","weightGrams","lengthMm","widthMm","heightMm")
   values(vid,product_id,nullif(v->>'sku',''),option_data,(v->>'unitPriceZar')::numeric,coalesce((v->>'active')::boolean,true),coalesce((v->>'sortOrder')::integer,0),
    (v->>'weightGrams')::integer,(v->>'lengthMm')::integer,(v->>'widthMm')::integer,(v->>'heightMm')::integer)
   on conflict(id) do update set sku=excluded.sku,"optionValues"=excluded."optionValues","unitPriceZar"=excluded."unitPriceZar",active=excluded.active,"sortOrder"=excluded."sortOrder",
   "weightGrams"=excluded."weightGrams","lengthMm"=excluded."lengthMm","widthMm"=excluded."widthMm","heightMm"=excluded."heightMm";
   select "onHand" into current_stock from public.product_inventory where "variantId"=vid for update;
   desired:=current_stock;
   if current_v.id is null then desired:=coalesce((v->>'onHand')::integer,0);
   elsif v ? 'stockAdjustment' then
     if (v->'stockAdjustment'->>'expectedOnHand')::integer is distinct from current_stock then raise exception 'Stock changed since this product was loaded. Reload before changing stock.'; end if;
     desired:=(v->'stockAdjustment'->>'newOnHand')::integer;
   end if;
   select coalesce(sum(quantity),0)::integer into hold_count from public.inventory_reservations where "variantId"=vid and state='held' and "expiresAt">now();
   if desired is null or desired<hold_count then raise exception 'Stock cannot be lower than quantities reserved for pending payments.'; end if;
   update public.product_inventory set "onHand"=desired where "variantId"=vid and "onHand" is distinct from desired;
 end loop;
 select to_jsonb(p)-'live' into result from public.products p where id=product_id;
 return result||jsonb_build_object('variants',(select coalesce(jsonb_agg((to_jsonb(pv)-'live')||jsonb_build_object('onHand',i."onHand") order by pv."sortOrder",pv.id),'[]'::jsonb) from public.product_variants pv join public.product_inventory i on i."variantId"=pv.id where pv."productId"=product_id));
end; $$;
revoke all on function public.save_physical_product(jsonb,jsonb) from public,anon,service_role;
grant execute on function public.save_physical_product(jsonb,jsonb) to authenticated;

create or replace function private.queue_product_variant_content_change() returns trigger language plpgsql set search_path='' as $$
begin
 if coalesce(current_setting('app.publishing',true),'')='on' then
   if tg_op='DELETE' then return old; else return new; end if;
 end if;
 if tg_op='UPDATE' and private.content_of(to_jsonb(new)) is not distinct from private.content_of(to_jsonb(old)) then return new; end if;
 if tg_op='DELETE' then
  update public.products set status='queued' where id=old."productId" and status='published'; return old;
 else
  update public.products set status='queued' where id=new."productId" and status='published'; return new;
 end if;
end; $$;
revoke all on function private.queue_product_variant_content_change() from public,anon,authenticated,service_role;
commit;

-- BEGIN order line identity (2026-11-12)
-- Order line identity (2026-11-12). Safe to re-run.
--
-- Order lines were keyed only by the slug they were bought under, and slugs
-- can change. This patch:
--   * records productId / bundleId on every new digital order line;
--   * resolves older slug-only lines through the slug history, so a renamed
--     resource still counts as owned (mirrors apps/functions order-entitlements);
--   * clears purchased cart lines by id as well as slug;
--   * stops a product or bundle taking a slug that still redirects to another
--     record, which would otherwise hand that record's buyers the wrong files;
--   * lets a record be renamed back to one of its own earlier slugs.
-- No existing rows are rewritten. The functions app works before and after
-- this patch is applied.
begin;

create or replace function private.order_line_entity(item jsonb, placed_at timestamptz)
returns table (kind text, entity_id uuid)
language plpgsql stable set search_path = '' as $$
declare
  line_slug text := item->>'productSlug';
  uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  redirect_kind text;
  redirect_id uuid;
  redirect_created timestamptz;
  direct_kind text;
  direct_id uuid;
begin
  if jsonb_typeof(item) <> 'object' or coalesce(item->>'productType', 'digital') = 'physical' or item->>'productKind' = 'Physical' then
    return;
  end if;
  if coalesce(item->>'productId', '') ~ uuid_pattern then
    kind := 'product'; entity_id := (item->>'productId')::uuid; return next; return;
  end if;
  if coalesce(item->>'bundleId', '') ~ uuid_pattern then
    kind := 'bundle'; entity_id := (item->>'bundleId')::uuid; return next; return;
  end if;
  if nullif(line_slug, '') is null then return; end if;

  select r."entityType", r."entityId", r."createdAt" into redirect_kind, redirect_id, redirect_created
  from public.slug_redirects r where r."fromPath" = '/shop/' || line_slug;
  select 'product', p.id into direct_kind, direct_id from public.products p where p.slug = line_slug;
  if direct_id is null then
    select 'bundle', b.id into direct_kind, direct_id from public.bundles b where b.slug = line_slug;
  end if;

  -- A rename after the purchase means the redirect names what was bought.
  if redirect_id is not null and (direct_id is null or (placed_at is not null and placed_at < redirect_created)) then
    kind := redirect_kind; entity_id := redirect_id; return next; return;
  end if;
  if direct_id is not null then
    kind := direct_kind; entity_id := direct_id; return next;
  end if;
end;
$$;
revoke all on function private.order_line_entity(jsonb, timestamptz) from public, anon, authenticated;
grant execute on function private.order_line_entity(jsonb, timestamptz) to service_role;

-- The download functions read slug history with the service role.
grant select on public.slug_redirects to service_role;

create or replace function public.quote_promotional_order(p_customer_id uuid, p_slugs text[], p_coupon_code text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  slugs text[];
  cart_ids uuid[];
  coupon public.coupons%rowtype;
  previous public.orders%rowtype;
  lines jsonb;
  subtotal numeric;
  eligible numeric;
  discount numeric := 0;
  coupon_code text := nullif(upper(btrim(p_coupon_code)), '');
begin
  select array_agg(distinct s order by s) into slugs from unnest(p_slugs) s;
  if coalesce(cardinality(slugs),0) = 0 then raise exception 'Cart is empty.'; end if;
  if coupon_code is not null then
    select * into coupon from public.coupons where code = coupon_code;
    if not found then raise exception 'Invalid discount code.'; end if;
    select o.* into previous from public.coupon_redemptions r join public.orders o on o.id=r."orderId"
      where r."couponId"=coupon.id and r."customerId"=p_customer_id;
    if found then
      if previous.status <> 'pending' then raise exception 'You have already used this discount code.'; end if;
      if (select array_agg(i->>'productSlug' order by i->>'productSlug') from jsonb_array_elements(previous.items) i) is distinct from slugs then
        raise exception 'This code is reserved for a pending checkout. Retry the original basket, or wait for a confirmed payment cancellation.';
      end if;
      return jsonb_build_object('items',previous.items,'subtotalZar',previous."subtotalZar",'discountZar',previous."discountZar",
        'totalZar',previous."totalZar",'couponCode',previous."couponCode",'couponId',previous."couponId",
        'orderId',previous.id,'paymentId',previous."paymentId",'reference',previous.reference);
    end if;
    if not coupon.enabled or (coupon."startsAt" is not null and now() < coupon."startsAt") or (coupon."expiresAt" is not null and now() >= coupon."expiresAt") then
      raise exception 'This discount code is inactive or expired.';
    end if;
  end if;
  -- Ownership compares what was bought (by id, or a slug read through its
  -- history) with what is in the cart, so a renamed resource stays owned.
  select coalesce(array_agg(c.id), '{}'::uuid[]) into cart_ids from (
    select id from public.catalog_products where slug = any(slugs)
    union all
    select id from public.catalog_bundles where slug = any(slugs)
  ) c;
  if exists (select 1 from public.orders o cross join lateral jsonb_array_elements(o.items) i
    cross join lateral private.order_line_entity(i, o."placedAt") owned
    where o."customerId"=p_customer_id and o.status in ('paid','fulfilled','payment_review') and owned.entity_id = any(cart_ids)) then
    raise exception 'Your account already owns one or more cart items.';
  end if;
  select jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'productSlug',slug,'title',title,'productKind',kind,
      'grade',grade,'priceZar',actual,'originalPriceZar',price,'onSale',actual < price)
      || case when kind = 'Bundle' then jsonb_build_object('bundleId', entity_id) else jsonb_build_object('productId', entity_id) end
      order by slug),
    sum(actual), sum(case when coupon."allowSaleItems" or actual=price then actual else 0 end)
    into lines,subtotal,eligible
  from (
    select id as entity_id,slug,title,'Single' as kind,grade,"priceZar" as price,
      public.promotion_price("priceZar","salePriceZar","saleStartsAt","saleEndsAt",now()) as actual
    from public.catalog_products where slug=any(slugs)
    union all
    select id,slug,title,'Bundle',grade,"priceZar",public.promotion_price("priceZar","salePriceZar","saleStartsAt","saleEndsAt",now())
    from public.catalog_bundles where slug=any(slugs)
  ) catalogue;
  if coalesce(jsonb_array_length(lines),0) <> cardinality(slugs) then raise exception 'One or more cart items are unavailable.'; end if;
  if coupon_code is not null then
    if eligible <= 0 then raise exception 'This discount code does not apply to items already on sale.'; end if;
    discount := least(eligible, case when coupon."discountType"='percentage' then round(eligible * coupon.value / 100,2) else coupon.value end);
  end if;
  if subtotal-discount <= 0 then raise exception 'Order total must be greater than zero. This discount would make the order free.'; end if;
  return jsonb_build_object('items',lines,'subtotalZar',subtotal,'discountZar',discount,'totalZar',subtotal-discount,
    'couponCode',coupon_code,'couponId',coupon.id);
end;
$$;
revoke all on function public.quote_promotional_order(uuid,text[],text) from public,anon,authenticated;
grant execute on function public.quote_promotional_order(uuid,text[],text) to service_role;

create or replace function public.clear_purchased_cart_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchased_slugs text[];
  purchased_product_ids uuid[];
  purchased_bundle_ids uuid[];
  uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if new.status not in ('paid', 'fulfilled') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('paid', 'fulfilled') then
    return new;
  end if;
  if jsonb_typeof(new.items) <> 'array' then
    return new;
  end if;

  select
    coalesce(array_agg(item ->> 'productSlug') filter (where item ->> 'productSlug' is not null), '{}'),
    coalesce(array_agg((item ->> 'productId')::uuid) filter (where coalesce(item ->> 'productId', '') ~ uuid_pattern), '{}'),
    coalesce(array_agg((item ->> 'bundleId')::uuid) filter (where coalesce(item ->> 'bundleId', '') ~ uuid_pattern), '{}')
    into purchased_slugs, purchased_product_ids, purchased_bundle_ids
    from jsonb_array_elements(new.items) as item;

  delete from public.cart_items ci
  using public.carts c
  where ci."cartId" = c.id
    and c."customerId" = new."customerId"
    and (
      ci."productId" = any (purchased_product_ids)
      or ci."bundleId" = any (purchased_bundle_ids)
      or ci."productId" in (select p.id from public.products p where p.slug = any (purchased_slugs))
      or ci."bundleId" in (select b.id from public.bundles b where b.slug = any (purchased_slugs))
    );

  return new;
end;
$$;
revoke execute on function public.clear_purchased_cart_items() from public, anon, authenticated;

-- Renaming a record back to one of its earlier slugs used to fail: the chain
-- collapse turned the old a -> b redirect into a -> a (violating
-- slug_redirects_from_not_to) before the stale row was deleted. Delete first.
create or replace function public.handle_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_path text := '/shop/' || old.slug;
  new_path text := '/shop/' || new.slug;
  entity   text := case when tg_table_name = 'bundles' then 'bundle' else 'product' end;
begin
  if new.slug is distinct from old.slug then
    delete from public.slug_redirects where "fromPath" = new_path;

    update public.slug_redirects
      set "toPath" = new_path
      where "toPath" = old_path;

    insert into public.slug_redirects ("entityType", "entityId", "fromPath", "toPath", "statusCode", "createdBy")
    values (entity, new.id, old_path, new_path, 301, auth.uid())
    on conflict ("fromPath") do update
      set "toPath" = excluded."toPath",
          "entityId" = excluded."entityId",
          "entityType" = excluded."entityType",
          "statusCode" = excluded."statusCode";
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_product_slug_change() from public, anon, authenticated;

-- Definer: admins save products as `authenticated`, which cannot read
-- slug_redirects directly.
create or replace function private.guard_retired_slug_reuse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then
    return new;
  end if;
  -- The admin saves with an upsert, which fires this INSERT check for a row
  -- that already exists; a record keeping its own slug is not a reuse.
  if tg_op = 'INSERT' and (
    (tg_table_name = 'products' and exists (select 1 from public.products p where p.id = new.id and p.slug = new.slug))
    or (tg_table_name = 'bundles' and exists (select 1 from public.bundles b where b.id = new.id and b.slug = new.slug))
  ) then
    return new;
  end if;
  if exists (
    select 1 from public.slug_redirects r
    where r."fromPath" = '/shop/' || new.slug and r."entityId" is not null and r."entityId" <> new.id
  ) then
    raise exception 'The address /shop/% belonged to another product or bundle and still redirects there. Choose a different slug.', new.slug
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_retired_slug_reuse() from public, anon, authenticated;

drop trigger if exists products_guard_retired_slug on public.products;
create trigger products_guard_retired_slug
  before insert or update of slug on public.products
  for each row execute function private.guard_retired_slug_reuse();
drop trigger if exists bundles_guard_retired_slug on public.bundles;
create trigger bundles_guard_retired_slug
  before insert or update of slug on public.bundles
  for each row execute function private.guard_retired_slug_reuse();

commit;

-- BEGIN physical product options (2026-11-12)
-- Physical product options (2026-11-12). Safe to re-run.
-- Apply after 2026-11-10-physical-commerce.sql and 2026-11-12-order-line-identity.sql.
--
-- Physical commerce has not launched, so this reshapes its option model
-- before any customer data depends on it:
--   * products declare their stocked options ("variantOptions": Colour, Size)
--     with optional colour swatches; every variant must use declared values and
--     active variants cannot repeat a combination;
--   * personalisation choices may be objects with a label, swatch and price
--     change; questions can apply only to some variants ("appliesWhen") and
--     carry shopper instructions ("help");
--     text answers can be forced to capitals ("transform": "uppercase");
--   * per-letter pricing counts billable letters case-insensitively;
--   * variants are either stock-counted ("tracked") or made to order;
--   * one SQL function prices a physical unit;
--   * discount codes can cover physical lines (never shipping);
--   * an administrator can resolve an order held for stock review.
begin;

alter table public.products
  add column if not exists "variantOptions" jsonb not null default '[]'::jsonb,
  add column if not exists "leadTimeDays" integer,
  add column if not exists "previewTemplate" text;
alter table public.product_variants
  add column if not exists "inventoryPolicy" text not null default 'tracked';

alter table public.product_variants drop constraint if exists product_variants_inventory_policy_check;
alter table public.product_variants add constraint product_variants_inventory_policy_check
  check ("inventoryPolicy" in ('tracked', 'made_to_order'));

-- ---------------------------------------------------------------------------
-- Configuration validators (mirrored in packages/cms/src/lib/physical-products.ts)
-- ---------------------------------------------------------------------------

create or replace function private.valid_variant_options(options jsonb)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  opt jsonb;
  val jsonb;
  keys text[] := '{}'::text[];
  vals text[];
begin
  if options is null or jsonb_typeof(options) <> 'array' or jsonb_array_length(options) > 3 then return false; end if;
  for opt in select value from jsonb_array_elements(options) as o(value) loop
    if jsonb_typeof(opt) <> 'object' or (opt - 'key' - 'label' - 'display' - 'values') <> '{}'::jsonb
       or jsonb_typeof(opt->'key') <> 'string' or jsonb_typeof(opt->'label') <> 'string'
       or btrim(opt->>'key') = '' or btrim(opt->>'label') = '' or opt->>'key' = any(keys)
       or (opt ? 'display' and coalesce(opt->>'display', '') not in ('buttons', 'swatches'))
       or jsonb_typeof(opt->'values') <> 'array' or jsonb_array_length(opt->'values') = 0
       or jsonb_array_length(opt->'values') > 50 then
      return false;
    end if;
    keys := array_append(keys, opt->>'key');
    vals := '{}'::text[];
    for val in select value from jsonb_array_elements(opt->'values') as v(value) loop
      if jsonb_typeof(val) <> 'object' or (val - 'value' - 'swatch') <> '{}'::jsonb
         or jsonb_typeof(val->'value') <> 'string' or btrim(val->>'value') = '' or val->>'value' = any(vals)
         or (val ? 'swatch' and (jsonb_typeof(val->'swatch') <> 'string' or val->>'swatch' !~ '^#[0-9a-fA-F]{6}$')) then
        return false;
      end if;
      vals := array_append(vals, val->>'value');
    end loop;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;
revoke all on function private.valid_variant_options(jsonb) from public, anon, authenticated;
grant execute on function private.valid_variant_options(jsonb) to authenticated, service_role;

-- A choice is a plain string or {value, label?, swatch?, priceDeltaZar?}.
create or replace function private.choice_value(choice jsonb)
returns text
language sql immutable set search_path = '' as $$
  select case jsonb_typeof(choice) when 'string' then choice #>> '{}' when 'object' then choice->>'value' else null end;
$$;
revoke all on function private.choice_value(jsonb) from public, anon, authenticated;
grant execute on function private.choice_value(jsonb) to authenticated, service_role;

create or replace function private.valid_customization_rules(rules jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  rule jsonb;
  rule_key text;
  rule_type text;
  constraints jsonb;
  option_value jsonb;
  condition record;
  seen_keys text[] := '{}'::text[];
  seen_options text[];
  min_length numeric;
  max_length numeric;
  delta numeric;
  trim_characters text := E' \t\n\r\f' || chr(11) || chr(160) || chr(5760)
    || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197)
    || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232)
    || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279);
begin
  if rules is null or jsonb_typeof(rules) <> 'array' then return false; end if;

  for rule in select value from jsonb_array_elements(rules) as values(value) loop
    if jsonb_typeof(rule) <> 'object'
       or not (rule ? 'key' and rule ? 'label' and rule ? 'type' and rule ? 'required')
       or jsonb_typeof(rule->'key') <> 'string'
       or jsonb_typeof(rule->'label') <> 'string'
       or jsonb_typeof(rule->'type') <> 'string'
       or jsonb_typeof(rule->'required') <> 'boolean' then
      return false;
    end if;

    rule_key := rule->>'key';
    rule_type := rule->>'type';
    if rule_key is null or btrim(rule_key, trim_characters) = ''
       or btrim(rule->>'label', trim_characters) = '' or rule_key = any(seen_keys) then
      return false;
    end if;
    seen_keys := array_append(seen_keys, rule_key);

    -- Optional instructions shown to shoppers under the question.
    if rule ? 'help' and (jsonb_typeof(rule->'help') <> 'string' or char_length(rule->>'help') > 300) then return false; end if;
    if rule ? 'appliesWhen' then
      if jsonb_typeof(rule->'appliesWhen') <> 'object' or rule->'appliesWhen' = '{}'::jsonb then return false; end if;
      for condition in select key, value from jsonb_each(rule->'appliesWhen') loop
        if btrim(condition.key) = '' or jsonb_typeof(condition.value) <> 'array' or jsonb_array_length(condition.value) = 0
           or exists (select 1 from jsonb_array_elements(condition.value) c where jsonb_typeof(c) <> 'string' or btrim(c #>> '{}') = '') then
          return false;
        end if;
      end loop;
    end if;

    if rule_type = 'text' then
      if rule ? 'options' or (rule - 'key' - 'label' - 'type' - 'required' - 'constraints' - 'transform' - 'appliesWhen' - 'help') <> '{}'::jsonb then
        return false;
      end if;
      if rule ? 'transform' and coalesce(rule->>'transform', '') <> 'uppercase' then return false; end if;
      if rule ? 'constraints' then
        constraints := rule->'constraints';
        if jsonb_typeof(constraints) <> 'object'
           or (constraints - 'minLength' - 'maxLength' - 'allowedCharacters' - 'allowSpaces') <> '{}'::jsonb then
          return false;
        end if;
        if constraints ? 'minLength' then
          if jsonb_typeof(constraints->'minLength') <> 'number' then return false; end if;
          min_length := (constraints->>'minLength')::numeric;
          if min_length < 0 or min_length <> trunc(min_length) or min_length > 2147483647 then return false; end if;
        else
          min_length := null;
        end if;
        if constraints ? 'maxLength' then
          if jsonb_typeof(constraints->'maxLength') <> 'number' then return false; end if;
          max_length := (constraints->>'maxLength')::numeric;
          if max_length < 0 or max_length <> trunc(max_length) or max_length > 2147483647 then return false; end if;
        else
          max_length := null;
        end if;
        if min_length is not null and max_length is not null and min_length > max_length then return false; end if;
        if constraints ? 'allowedCharacters' and jsonb_typeof(constraints->'allowedCharacters') <> 'string' then return false; end if;
        if constraints ? 'allowSpaces' and jsonb_typeof(constraints->'allowSpaces') <> 'boolean' then return false; end if;
      end if;
    elsif rule_type = 'select' then
      if rule ? 'constraints' or rule ? 'transform' or not (rule ? 'options')
         or (rule - 'key' - 'label' - 'type' - 'required' - 'options' - 'display' - 'appliesWhen' - 'help') <> '{}'::jsonb
         or jsonb_typeof(rule->'options') <> 'array'
         or jsonb_array_length(rule->'options') = 0
         or (rule ? 'display' and coalesce(rule->>'display', '') not in ('buttons', 'swatches', 'dropdown')) then
        return false;
      end if;
      seen_options := '{}'::text[];
      for option_value in select value from jsonb_array_elements(rule->'options') as options(value) loop
        if jsonb_typeof(option_value) = 'object' then
          if (option_value - 'value' - 'label' - 'swatch' - 'priceDeltaZar') <> '{}'::jsonb
             or jsonb_typeof(option_value->'value') <> 'string'
             or (option_value ? 'label' and (jsonb_typeof(option_value->'label') <> 'string' or btrim(option_value->>'label', trim_characters) = ''))
             or (option_value ? 'swatch' and (jsonb_typeof(option_value->'swatch') <> 'string' or option_value->>'swatch' !~ '^#[0-9a-fA-F]{6}$')) then
            return false;
          end if;
          if option_value ? 'priceDeltaZar' then
            if jsonb_typeof(option_value->'priceDeltaZar') <> 'number' then return false; end if;
            delta := (option_value->>'priceDeltaZar')::numeric;
            if delta < 0 or delta > 100000 or delta <> round(delta, 2) then return false; end if;
          end if;
        elsif jsonb_typeof(option_value) <> 'string' then
          return false;
        end if;
        if btrim(private.choice_value(option_value), trim_characters) = ''
           or private.choice_value(option_value) = any(seen_options) then
          return false;
        end if;
        seen_options := array_append(seen_options, private.choice_value(option_value));
      end loop;
    else
      return false;
    end if;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;
revoke all on function private.valid_customization_rules(jsonb) from public, anon, authenticated;
grant execute on function private.valid_customization_rules(jsonb) to authenticated, service_role;

-- Questions may not reuse a stocked option's key (the variant carries that
-- choice), may only depend on declared options and values, and the per-letter
-- pricing question must always apply.
create or replace function private.valid_physical_configuration(variant_options jsonb, rules jsonb, pricing_field_key text)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  rule jsonb;
  condition record;
  declared jsonb;
begin
  if not private.valid_variant_options(variant_options) or not private.valid_customization_rules(rules) then return false; end if;
  for rule in select value from jsonb_array_elements(rules) as r(value) loop
    if exists (select 1 from jsonb_array_elements(variant_options) o where o->>'key' = rule->>'key') then return false; end if;
    if rule ? 'appliesWhen' then
      if rule->>'key' = pricing_field_key then return false; end if;
      for condition in select key, value from jsonb_each(rule->'appliesWhen') loop
        select o into declared from jsonb_array_elements(variant_options) o where o->>'key' = condition.key;
        if declared is null then return false; end if;
        if exists (
          select 1 from jsonb_array_elements_text(condition.value) wanted(v)
          where not exists (select 1 from jsonb_array_elements(declared->'values') offered where offered->>'value' = wanted.v)
        ) then return false; end if;
        declared := null;
      end loop;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;
revoke all on function private.valid_physical_configuration(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function private.valid_physical_configuration(jsonb, jsonb, text) to authenticated, service_role;

create or replace function private.variant_conforms(declared jsonb, option_values jsonb)
returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(option_values) = 'object'
    and (select count(*) from jsonb_object_keys(option_values)) = jsonb_array_length(coalesce(declared, '[]'::jsonb))
    and not exists (
      select 1 from jsonb_array_elements(coalesce(declared, '[]'::jsonb)) o
      where jsonb_typeof(option_values->(o->>'key')) is distinct from 'string'
        or not exists (select 1 from jsonb_array_elements(o->'values') v where v->>'value' = option_values->>(o->>'key'))
    );
$$;
revoke all on function private.variant_conforms(jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.variant_conforms(jsonb, jsonb) to authenticated, service_role;

create or replace function private.rule_applies(rule jsonb, variant_values jsonb)
returns boolean
language sql immutable set search_path = '' as $$
  select not (rule ? 'appliesWhen') or not exists (
    select 1 from jsonb_each(rule->'appliesWhen') c
    where not (c.value ? coalesce(variant_values->>c.key, ''))
  );
$$;
revoke all on function private.rule_applies(jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.rule_applies(jsonb, jsonb) to authenticated, service_role;

-- Backfill declared options from existing variants (local previews only; no
-- production physical rows exist). Questions that duplicated a stocked option
-- are dropped because the variant now carries that choice.
with pairs as (
  select v."productId", e.key, e.value #>> '{}' as val, min(v."sortOrder") as ord
  from public.product_variants v cross join lateral jsonb_each(v."optionValues") e
  where jsonb_typeof(e.value) = 'string'
  group by 1, 2, 3
), dims as (
  select "productId", key, jsonb_agg(jsonb_build_object('value', val) order by ord, val) as vals
  from pairs group by 1, 2
), opts as (
  select "productId",
    jsonb_agg(jsonb_build_object('key', key, 'label', initcap(replace(key, '_', ' ')), 'values', vals) order by key) as options,
    array_agg(key) as option_keys
  from dims group by 1
)
update public.products p
set "variantOptions" = opts.options,
    "customizationRules" = coalesce((
      select jsonb_agg(r) from jsonb_array_elements(p."customizationRules") r where not (r->>'key' = any(opts.option_keys))
    ), '[]'::jsonb)
from opts
where p.id = opts."productId" and p."productType" = 'physical' and p."variantOptions" = '[]'::jsonb;

alter table public.products drop constraint if exists products_physical_presentation_check;
alter table public.products add constraint products_physical_presentation_check check (
  ("leadTimeDays" is null or "leadTimeDays" between 1 and 365)
  and ("previewTemplate" is null or "previewTemplate" in ('letter-tiles'))
  and ("productType" = 'physical' or ("variantOptions" = '[]'::jsonb and "leadTimeDays" is null and "previewTemplate" is null))
);
alter table public.products drop constraint if exists products_physical_configuration_check;
alter table public.products add constraint products_physical_configuration_check
  check (private.valid_physical_configuration("variantOptions", "customizationRules", "pricingFieldKey"));

-- Variants must use the declared options. Publishing copies rows untouched.
create or replace function private.guard_variant_options()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  declared jsonb;
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then return new; end if;
  select "variantOptions" into declared from public.products where id = new."productId";
  -- Variants turned off may keep a value the product no longer offers.
  if new.active and not private.variant_conforms(declared, new."optionValues") then
    raise exception 'Each product option needs one of its offered values. Update the options, then the variants.';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_variant_options() from public, anon, authenticated;
drop trigger if exists product_variants_guard_options on public.product_variants;
create trigger product_variants_guard_options
  before insert or update of "optionValues", "productId", active on public.product_variants
  for each row execute function private.guard_variant_options();

create unique index if not exists product_variants_active_options_unique
  on public.product_variants ("productId", "optionValues") where active;

-- ---------------------------------------------------------------------------
-- Customisation values and pricing
-- ---------------------------------------------------------------------------

create or replace function private.valid_customization_values(rules jsonb, submitted_values jsonb)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  rule jsonb;
  value_text text;
  rule_key text;
  rule_type text;
  constraints jsonb;
  allowed text;
  allow_spaces boolean;
  character_index integer;
  character text;
begin
  if rules is null or submitted_values is null or not private.valid_customization_rules(rules) or jsonb_typeof(submitted_values) <> 'object' then return false; end if;
  for rule in select value from jsonb_array_elements(rules) as r(value) loop
    rule_key := rule->>'key';
    rule_type := rule->>'type';
    if not (submitted_values ? rule_key) then
      if (rule->>'required')::boolean then return false; end if;
      continue;
    end if;
    if jsonb_typeof(submitted_values->rule_key) <> 'string' then return false; end if;
    value_text := submitted_values->>rule_key;
    if (rule->>'required')::boolean and value_text = '' then return false; end if;
    if rule_type = 'select' then
      if not exists (select 1 from jsonb_array_elements(rule->'options') o where private.choice_value(o) = value_text) then return false; end if;
      continue;
    end if;
    constraints := rule->'constraints';
    if constraints is null then constraints := '{}'::jsonb; end if;
    if constraints ? 'minLength' and char_length(value_text) < (constraints->>'minLength')::integer then return false; end if;
    if constraints ? 'maxLength' and char_length(value_text) > (constraints->>'maxLength')::integer then return false; end if;
    allowed := case when constraints ? 'allowedCharacters' then constraints->>'allowedCharacters' else null end;
    allow_spaces := coalesce((constraints->>'allowSpaces')::boolean, false);
    for character_index in 1..char_length(value_text) loop
      character := substr(value_text, character_index, 1);
      if character = ' ' and not allow_spaces then return false; end if;
      if allowed is not null and position(character in allowed) = 0 and not (character = ' ' and allow_spaces) then return false; end if;
    end loop;
  end loop;
  if exists (
    select 1 from jsonb_object_keys(submitted_values) submitted(key)
    where not exists (select 1 from jsonb_array_elements(rules) as r(value) where r.value->>'key' = submitted.key)
  ) then return false; end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_customization_values(jsonb,jsonb) from public, anon, authenticated, service_role;

-- Keep only answers for questions that apply to the chosen variant, and apply
-- each text question's transform. Unknown keys are kept so validation rejects them.
create or replace function private.normalize_customizations(rules jsonb, submitted jsonb, variant_values jsonb)
returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
  rule jsonb;
  rule_key text;
  result jsonb := submitted;
begin
  if submitted is null or jsonb_typeof(submitted) <> 'object' or jsonb_typeof(rules) <> 'array' then return submitted; end if;
  for rule in select value from jsonb_array_elements(rules) as r(value) loop
    rule_key := rule->>'key';
    if not private.rule_applies(rule, variant_values) then
      result := result - rule_key;
    elsif rule->>'type' = 'text' and rule->>'transform' = 'uppercase' and jsonb_typeof(result->rule_key) = 'string' then
      result := jsonb_set(result, array[rule_key], to_jsonb(upper(result->>rule_key)));
    end if;
  end loop;
  return result;
end;
$$;
revoke all on function private.normalize_customizations(jsonb, jsonb, jsonb) from public, anon, authenticated, service_role;

create or replace function private.valid_customization_values_for(rules jsonb, submitted jsonb, variant_values jsonb)
returns boolean
language sql immutable set search_path = '' as $$
  select private.valid_customization_values(
    coalesce((select jsonb_agg(r) from jsonb_array_elements(rules) r where private.rule_applies(r, variant_values)), '[]'::jsonb),
    submitted);
$$;
revoke all on function private.valid_customization_values_for(jsonb, jsonb, jsonb) from public, anon, authenticated, service_role;

-- The one place a physical unit price is calculated (TS mirror: physicalUnitPriceZar).
create or replace function private.physical_unit_price(product public.products, variant public.product_variants, customizations jsonb, at_time timestamptz)
returns numeric
language plpgsql stable set search_path = '' as $$
declare
  unit numeric;
  letters text;
  billable integer := 0;
  rule jsonb;
  chosen jsonb;
begin
  unit := coalesce(variant."unitPriceZar", public.promotion_price(product."priceZar", product."salePriceZar", product."saleStartsAt", product."saleEndsAt", at_time));
  if product."pricingMode" = 'per_character' then
    letters := coalesce(customizations->>product."pricingFieldKey", '');
    for i in 1..char_length(letters) loop
      if position(upper(substr(letters, i, 1)) in upper(product."billableCharacters")) > 0 then billable := billable + 1; end if;
    end loop;
    if billable < 1 then raise exception 'Enter a name containing a billable letter.'; end if;
    unit := unit * billable;
  end if;
  for rule in select value from jsonb_array_elements(coalesce(product."customizationRules", '[]'::jsonb)) as r(value) loop
    if rule->>'type' = 'select' and customizations ? (rule->>'key') then
      select o into chosen from jsonb_array_elements(rule->'options') o where private.choice_value(o) = customizations->>(rule->>'key') limit 1;
      if jsonb_typeof(chosen) = 'object' and chosen ? 'priceDeltaZar' then
        unit := unit + (chosen->>'priceDeltaZar')::numeric;
      end if;
      chosen := null;
    end if;
  end loop;
  return round(unit, 2);
end;
$$;
revoke all on function private.physical_unit_price(public.products, public.product_variants, jsonb, timestamptz) from public, anon, authenticated, service_role;

-- A code a customer may apply right now (checks mirror quote_promotional_order).
create or replace function private.claimable_coupon(p_customer_id uuid, p_code text)
returns public.coupons
language plpgsql stable set search_path = '' as $$
declare
  coupon public.coupons%rowtype;
  previous public.orders%rowtype;
begin
  select * into coupon from public.coupons where code = upper(btrim(p_code));
  if not found then raise exception 'Invalid discount code.'; end if;
  select o.* into previous from public.coupon_redemptions r join public.orders o on o.id = r."orderId"
    where r."couponId" = coupon.id and r."customerId" = p_customer_id;
  if found then
    if previous.status <> 'pending' then raise exception 'You have already used this discount code.'; end if;
    raise exception 'This code is reserved for a pending checkout. Retry the original basket, or wait for a confirmed payment cancellation.';
  end if;
  if not coupon.enabled or (coupon."startsAt" is not null and now() < coupon."startsAt") or (coupon."expiresAt" is not null and now() >= coupon."expiresAt") then
    raise exception 'This discount code is inactive or expired.';
  end if;
  return coupon;
end;
$$;
revoke all on function private.claimable_coupon(uuid, text) from public, anon, authenticated, service_role;

-- Discount codes may cover physical lines too (shipping is never discounted).
do $$
declare constraint_name text;
begin
  for constraint_name in
    select c.conname from pg_constraint c
    where c.conrelid = 'private.commerce_settings'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%physicalCouponPolicy%'
  loop
    execute format('alter table private.commerce_settings drop constraint %I', constraint_name);
  end loop;
end;
$$;
alter table private.commerce_settings add constraint commerce_settings_physical_coupon_policy_check
  check ("physicalCouponPolicy" in ('disabled', 'digital_only', 'all_products'));
alter table private.commerce_settings alter column "physicalCouponPolicy" set default 'all_products';
update private.commerce_settings set "physicalCouponPolicy" = 'all_products'
  where singleton and mode = 'disabled' and "physicalCouponPolicy" = 'disabled';

-- ---------------------------------------------------------------------------
-- Public catalogue, quote, order, payment
-- ---------------------------------------------------------------------------

drop function if exists private.published_physical_products() cascade;
create function private.published_physical_products()
returns table (
  id uuid, slug text, title text, "shortDescription" text, "fullDescription" text,
  "productType" text, "priceZar" numeric(10,2), "salePriceZar" numeric(10,2),
  "saleStartsAt" timestamptz, "saleEndsAt" timestamptz, "pricingMode" text,
  "pricingFieldKey" text, "billableCharacters" text, "customizationRules" jsonb,
  "galleryImages" jsonb, variants jsonb, published boolean,
  "variantOptions" jsonb, "leadTimeDays" integer, "previewTemplate" text
)
language sql stable security definer set search_path = '' as $$
  select l.id, l.slug, l.title, l."shortDescription", l."fullDescription", 'physical'::text,
    l."priceZar", l."salePriceZar", l."saleStartsAt", l."saleEndsAt", l."pricingMode",
    l."pricingFieldKey", l."billableCharacters", l."customizationRules", l."galleryImages",
    variants.rows, true,
    coalesce(l."variantOptions", '[]'::jsonb), l."leadTimeDays", l."previewTemplate"
  from private.commerce_settings settings
  join public.products p on p.live is not null
  cross join lateral jsonb_populate_record(null::public.products, p.live) l
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'sku', v.sku, 'optionValues', v."optionValues",
      'unitPriceZar', v."unitPriceZar",
      'madeToOrder', coalesce(v."inventoryPolicy", 'tracked') = 'made_to_order',
      'available', coalesce(v."inventoryPolicy", 'tracked') = 'made_to_order'
        or greatest(coalesce(i."onHand", 0) - coalesce(held.quantity, 0), 0) > 0
    ) order by v."sortOrder", v.id) as rows
    from public.product_variants current_variant
    cross join lateral jsonb_populate_record(null::public.product_variants, current_variant.live) v
    left join public.product_inventory i on i."variantId" = current_variant.id
    left join lateral (
      select sum(r.quantity)::integer as quantity
      from public.inventory_reservations r
      where r."variantId" = current_variant.id and r.state = 'held' and r."expiresAt" > now()
    ) held on true
    where current_variant."productId" = p.id and current_variant.live is not null and v.active
  ) variants
  where settings.singleton and settings.mode <> 'disabled'
    and l."productType" = 'physical' and p.published
    and jsonb_typeof(l."purchasedFiles") = 'array' and jsonb_array_length(l."purchasedFiles") = 0
    and private.valid_physical_pricing(l."productType", l."pricingMode", l."pricingFieldKey", l."billableCharacters", l."customizationRules") and variants.rows is not null;
$$;
revoke all on function private.published_physical_products() from public;
grant execute on function private.published_physical_products() to anon, authenticated, service_role;
create or replace view public.catalog_physical_products
with (security_invoker = on) as select * from private.published_physical_products();
grant select on public.catalog_physical_products to anon, authenticated, service_role;

create or replace function private.build_commerce_quote(
  p_customer_id uuid,
  p_digital_slugs text[],
  p_physical_items jsonb,
  p_coupon_code text,
  p_delivery jsonb,
  p_shipping_option_id text
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  settings private.commerce_settings%rowtype;
  digital_slugs text[];
  digital_quote jsonb := '{}'::jsonb;
  digital_items jsonb := '[]'::jsonb;
  physical_items jsonb := '[]'::jsonb;
  line jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  item_id uuid;
  product_slug text;
  variant_id uuid;
  quantity numeric;
  customizations jsonb;
  unit_rate numeric;
  regular_unit numeric;
  line_total numeric;
  line_on_sale boolean;
  inventory_policy text;
  field_labels jsonb;
  physical_subtotal numeric := 0;
  physical_regular numeric := 0;
  physical_sale numeric := 0;
  subtotal numeric;
  discount numeric := 0;
  eligible numeric;
  shipping numeric := 0;
  coupon_code text := nullif(upper(btrim(p_coupon_code)), '');
  applied_code text;
  coupon_id uuid;
  coupon public.coupons%rowtype;
  combined_coupon boolean;
  has_physical boolean;
  line_ids uuid[] := '{}'::uuid[];
  requested_variants uuid[] := '{}'::uuid[];
  requested_quantities integer[] := '{}'::integer[];
  variant_index integer;
  available integer;
  line_count integer;
  index_value integer;
begin
  select * into settings from private.commerce_settings where singleton;
  if not found then raise exception 'Commerce settings are unavailable.'; end if;
  if not exists (select 1 from public.users u where u.id = p_customer_id) then
    raise exception 'Customer account not found.';
  end if;
  if p_physical_items is null then p_physical_items := '[]'::jsonb; end if;
  if jsonb_typeof(p_physical_items) <> 'array' then raise exception 'Physical cart items must be an array.'; end if;
  select coalesce(array_agg(distinct slug order by slug), '{}'::text[]) into digital_slugs
  from unnest(coalesce(p_digital_slugs, '{}'::text[])) as slugs(slug);
  if exists (select 1 from unnest(digital_slugs) slug where nullif(btrim(slug), '') is null) then
    raise exception 'Digital product slugs must be non-empty.';
  end if;
  select count(*) > 0 into has_physical from jsonb_array_elements(p_physical_items);
  if cardinality(digital_slugs) = 0 and not has_physical then raise exception 'Cart is empty.'; end if;
  if has_physical and settings.mode = 'disabled' then raise exception 'Physical checkout is unavailable.'; end if;
  combined_coupon := coupon_code is not null and has_physical and settings."physicalCouponPolicy" = 'all_products';
  if has_physical and coupon_code is not null and not combined_coupon then
    if settings."physicalCouponPolicy" = 'disabled' then
      raise exception 'Discount codes are unavailable when your basket contains physical products.';
    elsif cardinality(digital_slugs) = 0 then
      raise exception 'This discount code applies to digital products only.';
    end if;
  end if;

  if cardinality(digital_slugs) > 200 or jsonb_array_length(p_physical_items) > 200 then raise exception 'Too many cart items.'; end if;
  if cardinality(digital_slugs) > 0 then
    -- A code that also covers physical lines is applied once, below.
    digital_quote := public.quote_promotional_order(p_customer_id, digital_slugs, case when combined_coupon then null else coupon_code end);
    select coalesce(jsonb_agg(e || jsonb_build_object('productType','digital','quantity',1,'unitPriceZar',(e->>'priceZar')::numeric)),'[]'::jsonb) into digital_items from jsonb_array_elements(coalesce(digital_quote->'items','[]'::jsonb)) e;
    if not combined_coupon then
      discount := coalesce((digital_quote->>'discountZar')::numeric, 0);
      coupon_id := nullif(digital_quote->>'couponId', '')::uuid;
      applied_code := nullif(digital_quote->>'couponCode', '');
    end if;
  elsif coupon_code is not null and not combined_coupon then
    raise exception 'This discount code applies to digital products only.';
  end if;

  line_count := jsonb_array_length(p_physical_items);
  for index_value in 0..line_count - 1 loop
    line := p_physical_items->index_value;
    if jsonb_typeof(line) <> 'object'
       or not (line ? 'id' and line ? 'productSlug' and line ? 'variantId' and line ? 'quantity')
       or exists (
         select 1 from jsonb_object_keys(line) supplied(key)
         where supplied.key not in ('id','productSlug','variantId','quantity','customizations')
       ) then
      raise exception 'Each physical cart line must contain an id, productSlug, variantId, quantity, and customizations.';
    end if;
    begin
      item_id := (line->>'id')::uuid;
      variant_id := (line->>'variantId')::uuid;
      quantity := (line->>'quantity')::numeric;
    exception when others then
      raise exception 'Physical cart line identifiers or quantity are invalid.';
    end;
    product_slug := line->>'productSlug';
    customizations := coalesce(line->'customizations', '{}'::jsonb);
    if nullif(btrim(product_slug), '') is null or jsonb_typeof(customizations) <> 'object'
       or jsonb_typeof(line->'quantity')<>'number' or item_id is null or variant_id is null or quantity is null or quantity <> trunc(quantity) or quantity < 1 or quantity > 2147483647 then
      raise exception 'Physical cart line identifiers, customizations, or quantity are invalid.';
    end if;
    if item_id = any(line_ids) then raise exception 'Duplicate physical cart line ids are not allowed.'; end if;
    line_ids := array_append(line_ids, item_id);

    select l.* into product_row
    from public.products p
    cross join lateral jsonb_populate_record(null::public.products, p.live) l
    where p.live is not null and p.published and l."productType" = 'physical'
      and l.slug = product_slug and jsonb_array_length(coalesce(l."purchasedFiles", '[]'::jsonb)) = 0;
    if not found or not private.valid_physical_pricing(
      product_row."productType", product_row."pricingMode", product_row."pricingFieldKey",
      product_row."billableCharacters", product_row."customizationRules"
    ) then raise exception 'One or more physical products are unavailable.'; end if;
    select l.* into variant_row
    from public.product_variants v
    cross join lateral jsonb_populate_record(null::public.product_variants, v.live) l
    where v.id = variant_id and v."productId" = product_row.id and v.live is not null
      and coalesce((v.live->>'active')::boolean, false);
    if not found then raise exception 'One or more selected product options are unavailable.'; end if;
    customizations := private.normalize_customizations(product_row."customizationRules", customizations, variant_row."optionValues");
    if not private.valid_customization_values_for(product_row."customizationRules", customizations, variant_row."optionValues") then
      raise exception 'Complete the product customization using the allowed values.';
    end if;

    unit_rate := private.physical_unit_price(product_row, variant_row, customizations, now());
    if not (unit_rate > 0 and unit_rate < 'Infinity'::numeric) then raise exception 'Physical item prices must be greater than zero.'; end if;
    line_total := round(unit_rate * quantity, 2);
    physical_subtotal := physical_subtotal + line_total;
    -- On sale = the product's scheduled sale price is what was charged.
    line_on_sale := variant_row."unitPriceZar" is null
      and public.promotion_price(product_row."priceZar", product_row."salePriceZar", product_row."saleStartsAt", product_row."saleEndsAt", now()) < product_row."priceZar";
    if line_on_sale then physical_sale := physical_sale + line_total; else physical_regular := physical_regular + line_total; end if;
    inventory_policy := coalesce(variant_row."inventoryPolicy", 'tracked');
    select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into field_labels from (
      select o->>'key' as k, o->>'label' as v from jsonb_array_elements(coalesce(product_row."variantOptions", '[]'::jsonb)) o
      union all
      select r->>'key', r->>'label' from jsonb_array_elements(coalesce(product_row."customizationRules", '[]'::jsonb)) r
    ) labels;
    physical_items := physical_items || jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid(), 'productSlug', product_row.slug, 'productId', product_row.id, 'title', product_row.title,
      'productKind', 'Physical', 'productType', 'physical', 'quantity', quantity::integer,
      'unitPriceZar', unit_rate, 'priceZar', line_total, 'onSale', line_on_sale,
      'customizations', customizations, 'variantId', variant_id,
      'optionValues', variant_row."optionValues", 'fieldLabels', field_labels,
      'inventoryPolicy', inventory_policy, 'cartLineId', item_id
    ));

    if inventory_policy = 'tracked' then
      variant_index := array_position(requested_variants, variant_id);
      if variant_index is null then
        requested_variants := array_append(requested_variants, variant_id);
        requested_quantities := array_append(requested_quantities, quantity::integer);
      else
        requested_quantities[variant_index] := requested_quantities[variant_index] + quantity::integer;
      end if;
    end if;
  end loop;

  for index_value in 1..coalesce(cardinality(requested_variants), 0) loop
    select greatest(coalesce(i."onHand",0) - coalesce((
      select sum(r.quantity)::integer from public.inventory_reservations r
      where r."variantId" = requested_variants[index_value] and r.state = 'held' and r."expiresAt" > now()
    ),0),0) into available
    from public.product_inventory i where i."variantId" = requested_variants[index_value];
    if coalesce(available,0) < requested_quantities[index_value] then
      raise exception 'One or more selected product options are no longer available.';
    end if;
  end loop;

  if combined_coupon then
    coupon := private.claimable_coupon(p_customer_id, coupon_code);
    eligible := physical_regular + case when coupon."allowSaleItems" then physical_sale else 0 end
      + coalesce((select sum((e->>'priceZar')::numeric) from jsonb_array_elements(digital_items) e
          where coupon."allowSaleItems" or not coalesce((e->>'onSale')::boolean, false)), 0);
    if eligible <= 0 then raise exception 'This discount code does not apply to items already on sale.'; end if;
    discount := least(eligible, case when coupon."discountType" = 'percentage' then round(eligible * coupon.value / 100, 2) else coupon.value end);
    coupon_id := coupon.id;
    applied_code := coupon.code;
  end if;

  if has_physical then
    if p_shipping_option_id is not null and p_shipping_option_id <> settings."shippingMethodId" then
      raise exception 'The selected shipping option is unavailable.';
    end if;
    shipping := settings."fixedShippingZar";
  end if;
  subtotal := coalesce((digital_quote->>'subtotalZar')::numeric, 0) + physical_subtotal;
  -- Same rule as the digital checkout: a code never makes the items free,
  -- even when shipping would still be charged.
  if subtotal - discount <= 0 then raise exception 'Order total must be greater than zero. This discount would make the order free.'; end if;
  if subtotal - discount + shipping <= 0 then raise exception 'Order total must be greater than zero.'; end if;
  return jsonb_build_object(
    'items', digital_items || physical_items,
    'subtotalZar', round(subtotal,2), 'discountZar', round(discount,2),
    'shippingZar', round(shipping,2), 'totalZar', round(subtotal-discount+shipping,2),
    'couponCode', applied_code, 'hasPhysical', has_physical,
    'shippingOption', case when has_physical then jsonb_build_object('id',settings."shippingMethodId",'label',settings."shippingLabel",'amountZar',settings."fixedShippingZar") else null end,
    'localPreview', settings.mode = 'local_preview', '_couponId', coupon_id
  );
end;
$$;
revoke all on function private.build_commerce_quote(uuid,text[],jsonb,text,jsonb,text) from public, anon, authenticated, service_role;

create or replace function public.create_commerce_order(
 p_customer_id uuid,p_digital_slugs text[],p_physical_items jsonb,p_coupon_code text,p_delivery jsonb,
 p_shipping_option_id text,p_reference text,p_expected_total_zar numeric
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 settings private.commerce_settings%rowtype; purchase public.orders%rowtype; customer public.users%rowtype;
 fingerprint text; quote jsonb; oid uuid := gen_random_uuid(); pid uuid := gen_random_uuid(); expiry timestamptz;
 coupon_id uuid; variant uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('commerce:'||p_customer_id::text,0));
 select * into settings from private.commerce_settings where singleton;
 if p_physical_items is null then p_physical_items := '[]'::jsonb; end if;
 if jsonb_typeof(p_physical_items)<>'array' then raise exception 'Physical items must be an array.'; end if;
 fingerprint := private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,p_delivery,p_shipping_option_id);
 -- Retry the identical accepted basket without repricing or reserving twice.
 select * into purchase from public.orders where "customerId"=p_customer_id and "commerceBasketFingerprint"=private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,null,null)
   and status='pending' order by "placedAt" desc limit 1 for update;
 if found then
   if purchase."hasPhysical" then
     if settings.mode='disabled' then raise exception 'Physical checkout is unavailable.'; end if;
     if not private.valid_delivery_details(p_delivery) then raise exception 'Complete your South African delivery details.'; end if;
     if p_shipping_option_id is distinct from purchase."shippingOptionId" then raise exception 'Choose the delivery option before checkout.'; end if;
     update public.orders set delivery=p_delivery,"commerceFingerprint"=fingerprint where id=purchase.id;
   end if;
   if p_expected_total_zar is null or purchase."totalZar" <> p_expected_total_zar then raise exception 'Prices changed. Review the updated total before paying.'; end if;
   if purchase."hasPhysical" and purchase."reservationExpiresAt"<=now() then
     for variant in select "variantId" from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
       perform 1 from public.product_inventory where "variantId"=variant for update;
       if coalesce((select i."onHand"-coalesce((select sum(r.quantity) from public.inventory_reservations r where r."variantId"=variant and r."orderId"<>purchase.id and r.state='held' and r."expiresAt">now()),0)
           from public.product_inventory i where i."variantId"=variant),0) < (select quantity from public.inventory_reservations where "orderId"=purchase.id and "variantId"=variant) then
         raise exception 'One or more selected product options are no longer available. Cancel this checkout and update your cart.';
       end if;
     end loop;
     expiry:=now()+make_interval(mins=>settings."reservationTtlMinutes");
     update public.inventory_reservations set state='held',"expiresAt"=expiry where "orderId"=purchase.id;
     update public.orders set "reservationExpiresAt"=expiry where id=purchase.id;
     purchase."reservationExpiresAt":=expiry;
   end if;
   return jsonb_build_object('orderId',purchase.id,'paymentId',purchase."paymentId",'reference',purchase.reference,
    'items',purchase.items,'subtotalZar',purchase."subtotalZar",'discountZar',purchase."discountZar",'totalZar',purchase."totalZar",
    'shippingZar',purchase."shippingZar",'couponCode',purchase."couponCode",'hasPhysical',purchase."hasPhysical",
    'localPreview',settings.mode='local_preview','reservationExpiresAt',purchase."reservationExpiresAt",
    'shippingOption',case when purchase."hasPhysical" then jsonb_build_object('id',purchase."shippingOptionId",'label',purchase."shippingMethod",'amountZar',purchase."shippingZar") else null end);
 end if;
 -- Serialize inventory with payment completion and stock edits in UUID order.
 for variant in select distinct (e->>'variantId')::uuid from jsonb_array_elements(p_physical_items) e order by 1 loop
   perform 1 from public.product_inventory where "variantId"=variant for update;
 end loop;
 if nullif(btrim(p_coupon_code),'') is not null then
   select id into coupon_id from public.coupons where code=upper(btrim(p_coupon_code));
   if coupon_id is not null then perform pg_advisory_xact_lock(hashtextextended(coupon_id::text||':'||p_customer_id::text,0)); perform 1 from public.coupons where id=coupon_id for share; end if;
 end if;
 quote := private.build_commerce_quote(p_customer_id,p_digital_slugs,p_physical_items,p_coupon_code,p_delivery,p_shipping_option_id);
 if (quote->>'hasPhysical')::boolean and not private.valid_delivery_details(p_delivery) then raise exception 'Complete the recipient name, contact number and South African delivery address.'; end if;
 if (quote->>'hasPhysical')::boolean and p_shipping_option_id is distinct from settings."shippingMethodId" then raise exception 'Choose the delivery option before checkout.'; end if;
 if p_expected_total_zar is null or (quote->>'totalZar')::numeric <> p_expected_total_zar then raise exception 'Prices changed. Review the updated total before paying.'; end if;
 select * into customer from public.users where id=p_customer_id;
 expiry := now()+make_interval(mins=>settings."reservationTtlMinutes");
 insert into public.orders(id,reference,"customerId","customerName","customerEmail",status,items,"totalZar","paymentId","subtotalZar","discountZar","couponCode","couponId","hasPhysical","shippingZar","shippingMethod","shippingOptionId",delivery,"fulfillmentStatus","reservationExpiresAt","commerceFingerprint","commerceBasketFingerprint")
 values(oid,p_reference,p_customer_id,customer.name,customer.email,'pending',quote->'items',(quote->>'totalZar')::numeric,pid,
 (quote->>'subtotalZar')::numeric,(quote->>'discountZar')::numeric,quote->>'couponCode',(quote->>'_couponId')::uuid,
 (quote->>'hasPhysical')::boolean,(quote->>'shippingZar')::numeric,case when (quote->>'hasPhysical')::boolean then settings."shippingLabel" end,
 case when (quote->>'hasPhysical')::boolean then settings."shippingMethodId" end,case when (quote->>'hasPhysical')::boolean then p_delivery end,
 case when (quote->>'hasPhysical')::boolean then 'unfulfilled' else 'not_required' end,expiry,fingerprint,private.commerce_fingerprint(coalesce(p_digital_slugs,'{}'),p_physical_items,p_coupon_code,null,null));
 insert into public.payments(id,"orderId",status,provider,reference,"amountZar") values(pid,oid,'pending',case when settings.mode='local_preview' then 'Simulation' else 'PayFast' end,p_reference,(quote->>'totalZar')::numeric);
 -- Made-to-order lines are not stock-counted, so they hold nothing.
 insert into public.inventory_reservations("orderId","variantId",quantity,"expiresAt")
 select oid,(e->>'variantId')::uuid,sum((e->>'quantity')::integer)::integer,expiry from jsonb_array_elements(quote->'items') e
 where e->>'productType'='physical' and coalesce(e->>'inventoryPolicy','tracked')='tracked' group by 2;
 if quote->>'_couponId' is not null then
   insert into public.coupon_redemptions("couponId","customerId","orderId") values((quote->>'_couponId')::uuid,p_customer_id,oid);
 end if;
 return (quote-'_couponId')||jsonb_build_object('orderId',oid,'paymentId',pid,'reference',p_reference,'reservationExpiresAt',expiry);
end; $$;
revoke all on function public.create_commerce_order(uuid,text[],jsonb,text,jsonb,text,text,numeric) from public,anon,authenticated;
grant execute on function public.create_commerce_order(uuid,text[],jsonb,text,jsonb,text,text,numeric) to service_role;

create or replace function public.complete_commerce_payment(p_payment_id uuid,p_provider_payment_id text,p_amount_zar numeric)
returns text language plpgsql security definer set search_path='' as $$
declare payment public.payments%rowtype; purchase public.orders%rowtype; hold record; stock integer; held integer; can_fulfill boolean:=true;
begin
 if nullif(btrim(p_provider_payment_id),'') is null or p_amount_zar is null or p_amount_zar<=0 then return 'rejected'; end if;
 select * into payment from public.payments where id=p_payment_id for update;
 if not found then return 'rejected'; end if;
 select * into purchase from public.orders where id=payment."orderId" for update;
 if not found or purchase."paymentId" is distinct from payment.id or payment."amountZar"<>p_amount_zar or purchase."totalZar"<>p_amount_zar
  or payment.provider not in ('PayFast','Simulation') or payment.status not in ('pending','succeeded') or purchase.status not in ('pending','paid','fulfilled','payment_review')
  or (payment."pfPaymentId" is not null and payment."pfPaymentId"<>p_provider_payment_id)
  or exists(select 1 from public.payments where "pfPaymentId"=p_provider_payment_id and id<>p_payment_id) then return 'rejected'; end if;
 if payment.status='succeeded' and purchase.status in ('paid','fulfilled','payment_review') then return case when purchase.status='payment_review' then 'review' else 'duplicate' end; end if;
 for hold in select * from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
   select "onHand" into stock from public.product_inventory where "variantId"=hold."variantId" for update;
   select coalesce(sum(quantity),0)::integer into held from public.inventory_reservations where "variantId"=hold."variantId" and "orderId"<>purchase.id and state='held' and "expiresAt">now();
   if stock is null or stock-held<hold.quantity then can_fulfill:=false; end if;
 end loop;
 -- Stock-counted lines must hold stock; made-to-order lines never do.
 if exists (select 1 from jsonb_array_elements(purchase.items) e where e->>'productType'='physical' and coalesce(e->>'inventoryPolicy','tracked')='tracked')
    and not exists(select 1 from public.inventory_reservations where "orderId"=purchase.id) then can_fulfill:=false; end if;
 -- All stock rows are locked before deciding or deducting any line.
 if can_fulfill then
   for hold in select * from public.inventory_reservations where "orderId"=purchase.id order by "variantId" loop
     update public.product_inventory set "onHand"="onHand"-hold.quantity where "variantId"=hold."variantId";
   end loop;
   update public.inventory_reservations set state='committed',"updatedAt"=now() where "orderId"=purchase.id;
 else
   update public.inventory_reservations set state='released',"updatedAt"=now() where "orderId"=purchase.id;
 end if;
 update public.payments set status='succeeded',"pfPaymentId"=p_provider_payment_id,"processedAt"=now() where id=p_payment_id;
 update public.orders set status=case when can_fulfill then 'paid' else 'payment_review' end,
  "fulfillmentStatus"=case when not "hasPhysical" then 'not_required' when can_fulfill then 'unfulfilled' else 'review' end where id=purchase.id;
 if can_fulfill then
   for hold in select (e->>'cartLineId')::uuid as line_id,(e->>'quantity')::integer as quantity from jsonb_array_elements(purchase.items) e where e->>'productType'='physical' loop
     delete from public.physical_cart_items where "userId"=purchase."customerId" and id=hold.line_id and quantity<=hold.quantity;
     update public.physical_cart_items set quantity=quantity-hold.quantity where "userId"=purchase."customerId" and id=hold.line_id;
   end loop;
 end if;
 return case when can_fulfill then 'processed' else 'review' end;
end; $$;
revoke all on function public.complete_commerce_payment(uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.complete_commerce_payment(uuid,text,numeric) to service_role;

-- ---------------------------------------------------------------------------
-- Stock review resolution
-- ---------------------------------------------------------------------------

alter table public.orders drop constraint if exists orders_fulfillment_status_check;
alter table public.orders add constraint orders_fulfillment_status_check
  check ("fulfillmentStatus" in ('not_required', 'unfulfilled', 'shipped', 'delivered', 'review', 'cancelled'));
alter table public.orders drop constraint if exists orders_fulfillment_shape_check;
alter table public.orders add constraint orders_fulfillment_shape_check check (
  ("hasPhysical" and "fulfillmentStatus" in ('unfulfilled', 'shipped', 'delivered', 'review', 'cancelled'))
  or (not "hasPhysical" and "fulfillmentStatus" = 'not_required' and "shippingZar" = 0 and delivery is null)
);

-- 'fulfil': stock is available now; take it and move the order to paid.
-- 'refunded': the whole payment was refunded in PayFast; nothing ships and
--   digital lines lock.
-- 'cancel_physical': only the physical items were refunded in PayFast; the
--   order stays paid so its digital lines remain available.
create or replace function public.resolve_payment_review(p_order_id uuid, p_decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  purchase public.orders%rowtype;
  line record;
  stock integer;
  held integer;
begin
  if not public.is_admin() then raise exception 'Administrator access is required.' using errcode = '42501'; end if;
  if p_decision not in ('fulfil', 'refunded', 'cancel_physical') then raise exception 'Choose to fulfil or record a refund.'; end if;
  -- Lock the payment before the order, as payment completion does.
  perform 1 from public.payments where id = (select "paymentId" from public.orders where id = p_order_id) for update;
  select * into purchase from public.orders where id = p_order_id for update;
  if not found or purchase.status <> 'payment_review' then raise exception 'Only orders awaiting a stock review can be resolved.'; end if;

  if p_decision = 'cancel_physical' then
    if not exists (select 1 from jsonb_array_elements(purchase.items) e where coalesce(e->>'productType', 'digital') <> 'physical') then
      raise exception 'This order has no digital items. Record a full refund instead.';
    end if;
    update public.orders set status = 'paid', "fulfillmentStatus" = 'cancelled' where id = purchase.id returning * into purchase;
    return to_jsonb(purchase);
  end if;

  if p_decision = 'refunded' then
    update public.payments set status = 'refunded' where id = purchase."paymentId" and status = 'succeeded';
    update public.orders set status = 'refunded', "fulfillmentStatus" = case when "hasPhysical" then 'cancelled' else 'not_required' end
      where id = purchase.id returning * into purchase;
    return to_jsonb(purchase);
  end if;

  for line in
    select (e->>'variantId')::uuid as variant_id, sum((e->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(purchase.items) e
    where e->>'productType' = 'physical' and coalesce(e->>'inventoryPolicy', 'tracked') = 'tracked'
    group by 1 order by 1
  loop
    select "onHand" into stock from public.product_inventory where "variantId" = line.variant_id for update;
    select coalesce(sum(quantity), 0)::integer into held from public.inventory_reservations
      where "variantId" = line.variant_id and "orderId" <> purchase.id and state = 'held' and "expiresAt" > now();
    if stock is null or stock - held < line.quantity then
      raise exception 'There is still not enough stock to fulfil this order. Restock it first, or refund the payment.';
    end if;
    update public.product_inventory set "onHand" = "onHand" - line.quantity where "variantId" = line.variant_id;
    insert into public.inventory_reservations ("orderId", "variantId", quantity, state, "expiresAt")
      values (purchase.id, line.variant_id, line.quantity, 'committed', now())
      on conflict ("orderId", "variantId") do update set quantity = excluded.quantity, state = 'committed', "updatedAt" = now();
  end loop;
  update public.orders set status = 'paid', "fulfillmentStatus" = 'unfulfilled' where id = purchase.id returning * into purchase;
  for line in
    select (e->>'cartLineId')::uuid as line_id, (e->>'quantity')::integer as quantity
    from jsonb_array_elements(purchase.items) e where e->>'productType' = 'physical'
  loop
    delete from public.physical_cart_items where "userId" = purchase."customerId" and id = line.line_id and quantity <= line.quantity;
    update public.physical_cart_items set quantity = quantity - line.quantity where "userId" = purchase."customerId" and id = line.line_id;
  end loop;
  return to_jsonb(purchase);
end;
$$;
revoke all on function public.resolve_payment_review(uuid, text) from public, anon, service_role;
grant execute on function public.resolve_payment_review(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin save
-- ---------------------------------------------------------------------------

create or replace function public.save_physical_product(p_product jsonb,p_variants jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare product_id uuid; row public.products%rowtype; allowed text[]; clean jsonb; v jsonb; vid uuid; current_v public.product_variants%rowtype;
 current_stock integer; desired integer; hold_count integer; option_data jsonb; result jsonb; policy text;
begin
 if not public.is_admin() then raise exception 'Administrator access is required.' using errcode='42501'; end if;
 if p_product->>'productType' is distinct from 'physical' or jsonb_typeof(p_variants)<>'array' then raise exception 'A physical product and its options are required.'; end if;
 product_id:=(p_product->>'id')::uuid;
 if product_id is null then raise exception 'Product id is required.'; end if;
 select * into row from public.products where id=product_id for update;
 if found and row."productType"<>'physical' then raise exception 'Product type cannot be changed.'; end if;
 if row.id is null then
   insert into public.products(id,slug,title,"productType") values(product_id,p_product->>'slug',p_product->>'title','physical') returning * into row;
 end if;
 allowed:=array['slug','title','shortDescription','fullDescription','priceZar','salePriceZar','saleStartsAt','saleEndsAt','grade','term','year','resourceFormat','subjects','marks','galleryImages','previewPdfs','featured','sortOrder','seo','faqs','weightGrams','lengthMm','widthMm','heightMm','customizationRules','pricingMode','pricingFieldKey','billableCharacters','status','variantOptions','leadTimeDays','previewTemplate'];
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into clean from jsonb_each(p_product) where key=any(allowed);
 row:=jsonb_populate_record(row,clean);
 update public.products set slug=row.slug,title=row.title,"shortDescription"=row."shortDescription","fullDescription"=row."fullDescription",
 "priceZar"=row."priceZar","salePriceZar"=row."salePriceZar","saleStartsAt"=row."saleStartsAt","saleEndsAt"=row."saleEndsAt",
 grade=row.grade,term=row.term,year=row.year,"resourceFormat"=row."resourceFormat",subjects=row.subjects,marks=row.marks,
 "galleryImages"=row."galleryImages","previewPdfs"=row."previewPdfs",featured=row.featured,"sortOrder"=row."sortOrder",seo=row.seo,faqs=row.faqs,
 "weightGrams"=row."weightGrams","lengthMm"=row."lengthMm","widthMm"=row."widthMm","heightMm"=row."heightMm",
 "customizationRules"=row."customizationRules","pricingMode"=row."pricingMode","pricingFieldKey"=row."pricingFieldKey","billableCharacters"=row."billableCharacters",
 "variantOptions"=coalesce(row."variantOptions",'[]'::jsonb),"leadTimeDays"=row."leadTimeDays","previewTemplate"=row."previewTemplate",status=row.status where id=product_id;
 for v in select e from jsonb_array_elements(p_variants) e order by e->>'id' loop
   vid:=(v->>'id')::uuid;
   if vid is null or (v->>'productId')::uuid is distinct from product_id then raise exception 'Product options must belong to this product.'; end if;
   select * into current_v from public.product_variants where id=vid for update;
   if found and current_v."productId"<>product_id then raise exception 'Product options cannot be moved.'; end if;
   option_data:=v->'optionValues';
   if jsonb_typeof(option_data)<>'object' or exists(select 1 from jsonb_each(option_data) where jsonb_typeof(value)<>'string' or nullif(btrim(key),'') is null or nullif(btrim(value#>>'{}'),'') is null) then raise exception 'Option choices must have a name and a value.'; end if;
   policy:=coalesce(nullif(v->>'inventoryPolicy',''),'tracked');
   insert into public.product_variants(id,"productId",sku,"optionValues","unitPriceZar",active,"sortOrder","weightGrams","lengthMm","widthMm","heightMm","inventoryPolicy")
   values(vid,product_id,nullif(v->>'sku',''),option_data,(v->>'unitPriceZar')::numeric,coalesce((v->>'active')::boolean,true),coalesce((v->>'sortOrder')::integer,0),
    (v->>'weightGrams')::integer,(v->>'lengthMm')::integer,(v->>'widthMm')::integer,(v->>'heightMm')::integer,policy)
   on conflict(id) do update set sku=excluded.sku,"optionValues"=excluded."optionValues","unitPriceZar"=excluded."unitPriceZar",active=excluded.active,"sortOrder"=excluded."sortOrder",
   "weightGrams"=excluded."weightGrams","lengthMm"=excluded."lengthMm","widthMm"=excluded."widthMm","heightMm"=excluded."heightMm","inventoryPolicy"=excluded."inventoryPolicy";
   select "onHand" into current_stock from public.product_inventory where "variantId"=vid for update;
   desired:=current_stock;
   if current_v.id is null then desired:=coalesce((v->>'onHand')::integer,0);
   elsif v ? 'stockAdjustment' then
     if (v->'stockAdjustment'->>'expectedOnHand')::integer is distinct from current_stock then raise exception 'Stock changed since this product was loaded. Reload before changing stock.'; end if;
     desired:=(v->'stockAdjustment'->>'newOnHand')::integer;
   end if;
   select coalesce(sum(quantity),0)::integer into hold_count from public.inventory_reservations where "variantId"=vid and state='held' and "expiresAt">now();
   if desired is null or desired<hold_count then raise exception 'Stock cannot be lower than quantities reserved for pending payments.'; end if;
   update public.product_inventory set "onHand"=desired where "variantId"=vid and "onHand" is distinct from desired;
 end loop;
 if exists (select 1 from public.product_variants pv where pv."productId"=product_id and pv.active and not private.variant_conforms(row."variantOptions", pv."optionValues")) then
   raise exception 'An available option still uses a value the product no longer offers. Update or turn off that option.';
 end if;
 select to_jsonb(p)-'live' into result from public.products p where id=product_id;
 return result||jsonb_build_object('variants',(select coalesce(jsonb_agg((to_jsonb(pv)-'live')||jsonb_build_object('onHand',i."onHand") order by pv."sortOrder",pv.id),'[]'::jsonb) from public.product_variants pv join public.product_inventory i on i."variantId"=pv.id where pv."productId"=product_id));
end; $$;
revoke all on function public.save_physical_product(jsonb,jsonb) from public,anon,service_role;
grant execute on function public.save_physical_product(jsonb,jsonb) to authenticated;

commit;
