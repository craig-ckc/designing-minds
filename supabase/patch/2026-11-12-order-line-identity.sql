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
