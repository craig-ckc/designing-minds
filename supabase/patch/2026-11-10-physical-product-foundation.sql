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
