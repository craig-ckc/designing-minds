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
