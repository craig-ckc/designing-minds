-- Clear purchased lines from the saved cart when an order is paid (2026-09-02).
--
-- Paste into the Supabase SQL editor after the other patches, or include it in
-- the migration run. Safe to re-run.
--
-- WHAT CHANGED -------------------------------------------------------------
--   * New trigger function public.clear_purchased_cart_items() and trigger
--     orders_clear_purchased_cart_items on public.orders: when an order enters
--     'paid' (or 'fulfilled'), every cart_items row in that customer's cart
--     that names a product or bundle on the order is deleted.
--
-- WHY THIS SHAPE -----------------------------------------------------------
-- Shoppers were coming back from PayFast to find the cart still full. The
-- website clears the browser copy on the return page, but that only runs if
-- the shopper actually comes back, and it raced the sign-in merge that
-- re-hydrates the cart from the account (fixed in apps/web/src/lib/cart.ts).
-- The account copy is cleared here instead, where the status actually
-- changes, so it holds for whichever path marks the order paid — the PayFast
-- ITN via the service role today, an administrator tomorrow — and whether or
-- not the shopper ever sees the return page.
--
-- Only the purchased lines go, not the whole cart: anything added since
-- checkout is still wanted. SECURITY DEFINER so the delete is not subject to
-- the caller's cart_items policies: the service role bypasses RLS anyway, but
-- an administrator marking an order paid from the admin app has no cart_items
-- policy at all and would silently clear nothing. The order's items are a
-- JSONB snapshot, so slugs are read off the lines and resolved against
-- products and bundles, which share one slug space.

begin;

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

commit;
