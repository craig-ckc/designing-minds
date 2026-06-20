create table if not exists public.cms_pages (
  id bigint primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  url text not null,
  date timestamptz not null,
  modified timestamptz not null,
  "menuOrder" integer not null default 0,
  "wordCount" integer not null default 0,
  status text not null,
  summary text not null default ''
);

create table if not exists public.cms_products (
  id bigint primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  url text not null,
  date timestamptz not null,
  modified timestamptz not null,
  "wordCount" integer not null default 0,
  grade text not null,
  term text not null,
  year text,
  marks text,
  type text not null,
  subjects text[] not null default '{}',
  "primarySubject" text not null,
  "priceZar" integer not null default 0,
  "priceLabel" text not null default '',
  status text not null,
  "previewLinks" text[] not null default '{}',
  tags text[] not null default '{}'
);

create table if not exists public.cms_asset_log (
  id bigint generated always as identity primary key,
  kind text not null,
  record_slug text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_row_modified_at()
returns trigger
language plpgsql
as $$
begin
  new.modified = now();
  return new;
end;
$$;

drop trigger if exists cms_pages_set_modified on public.cms_pages;
create trigger cms_pages_set_modified
before update on public.cms_pages
for each row
execute procedure public.set_row_modified_at();

drop trigger if exists cms_products_set_modified on public.cms_products;
create trigger cms_products_set_modified
before update on public.cms_products
for each row
execute procedure public.set_row_modified_at();

alter table public.cms_pages enable row level security;
alter table public.cms_products enable row level security;

create policy "Public can read pages"
on public.cms_pages
for select
to anon, authenticated
using (true);

create policy "Public can read products"
on public.cms_products
for select
to anon, authenticated
using (true);

create policy "Authenticated can write pages"
on public.cms_pages
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated can write products"
on public.cms_products
for all
to authenticated
using (true)
with check (true);
