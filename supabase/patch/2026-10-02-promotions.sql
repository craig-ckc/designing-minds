-- Promotions: published sale schedules, private admin coupons, and atomic reservations.
-- Apply before deploying the admin, storefront and functions changes.
alter table public.products add column if not exists "salePriceZar" numeric(10,2);
alter table public.products add column if not exists "saleStartsAt" timestamptz;
alter table public.products add column if not exists "saleEndsAt" timestamptz;
alter table public.products drop constraint if exists products_sale_valid;
alter table public.products add constraint products_sale_valid check (
  ("salePriceZar" is null or ("salePriceZar" > 0 and "salePriceZar" < "priceZar"))
  and ("saleStartsAt" is null or "saleEndsAt" is null or "saleStartsAt" < "saleEndsAt")
);
alter table public.bundles add column if not exists "salePriceZar" numeric(10,2);
alter table public.bundles add column if not exists "saleStartsAt" timestamptz;
alter table public.bundles add column if not exists "saleEndsAt" timestamptz;
alter table public.bundles drop constraint if exists bundles_sale_valid;
alter table public.bundles add constraint bundles_sale_valid check (
  ("salePriceZar" is null or ("salePriceZar" > 0 and "salePriceZar" < "priceZar"))
  and ("saleStartsAt" is null or "saleEndsAt" is null or "saleStartsAt" < "saleEndsAt")
);
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

create view public.catalog_products with (security_invoker = true) as select * from private.published_products();
create view public.catalog_bundles with (security_invoker = true) as select * from private.published_bundles();
grant select on public.catalog_products, public.catalog_bundles to anon, authenticated, service_role;
grant execute on function private.published_products(), private.published_bundles() to anon, authenticated, service_role;

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
