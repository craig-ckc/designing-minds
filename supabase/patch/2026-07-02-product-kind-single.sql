-- 2026-07-02 — Rename Product Kind value "Individual Resource" to "Single".
--
-- Idempotent and transactional: safe to re-run. Paste into the Supabase SQL
-- editor for existing projects after deploying code that expects `Single`.

begin;

-- Drop the old productKind check constraint, whatever generated name Postgres
-- gave it, so existing rows can be updated before the stricter check returns.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%productKind%'
  loop
    execute format('alter table public.products drop constraint %I', constraint_name);
  end loop;
end $$;

update public.products
set "productKind" = 'Single'
where "productKind" = 'Individual Resource';

update public.orders o
set items = updated.items
from (
  select
    id,
    jsonb_agg(
      case
        when item ->> 'productKind' = 'Individual Resource'
          then jsonb_set(item, '{productKind}', to_jsonb('Single'::text), false)
        else item
      end
      order by ordinality
    ) as items
  from public.orders
  cross join lateral jsonb_array_elements(items) with ordinality as order_items(item, ordinality)
  where items @> '[{"productKind":"Individual Resource"}]'::jsonb
  group by id
) as updated
where o.id = updated.id;

insert into public.value_lists (key, values)
values ('productKinds', array['Single', 'Bundle', 'Access Plan'])
on conflict (key) do update
set values = excluded.values,
    "updatedAt" = now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.conname = 'products_product_kind_check'
  ) then
    alter table public.products
      add constraint products_product_kind_check
      check ("productKind" in ('Single', 'Bundle', 'Access Plan'));
  end if;
end $$;

commit;
