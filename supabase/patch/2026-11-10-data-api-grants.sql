-- Explicit table grants for the Data API roles used by the site, customer
-- account/cart, admin CMS, and trusted functions. RLS remains responsible for
-- row-level access. Safe to run repeatedly on existing databases.

-- Public readers use sanitized catalogue views; value lists are directly read
-- by the browser/build client.
grant select on public.value_lists to anon, authenticated;

-- Authenticated users may read their own role and operational records. RLS
-- restricts these reads to the current customer or admin.
grant select on public.user_roles, public.users, public.orders, public.payments to authenticated;

-- The admin CMS edits these collections. Bundle membership is read for the
-- bundle embed; writes go through the admin-checked set_bundle_products RPC.
grant select, insert, update, delete on public.products, public.bundles, public.faqs, public.testimonials to authenticated;
grant select on public.bundle_products to authenticated;

-- Admin screens read form submissions; RLS limits results to administrators.
grant select on public.form_contact, public.form_newsletter to authenticated;

-- Customer carts are the only client-writable operational records. RLS limits
-- every cart and line to its owner.
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, delete on public.cart_items to authenticated;

-- Trusted functions use the service role for these direct data paths. Other
-- server operations use explicitly granted RPCs and need no table grant.
grant select on public.user_roles, public.users, public.orders, public.payments,
  public.products, public.bundles, public.bundle_products to service_role;
grant update on public.orders, public.payments to service_role;
grant insert on public.form_contact, public.form_newsletter to service_role;
