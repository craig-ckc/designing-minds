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
create or replace function private.published_physical_products()
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
