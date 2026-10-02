import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it } from 'vitest'

/* -------------------------------------------------------------------------
   supabase/seed.sql must load on a fresh schema.sql — and keep loading as the
   schema moves. It once rotted silently (it still inserted products columns
   the 2026-08-09 bundles patch had dropped); this pins it.
   ------------------------------------------------------------------------- */

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
const db = new PGlite()
const count = async (sql: string) => (await db.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0].n

beforeAll(async () => {
  await db.exec(`create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon nologin; create role authenticated nologin; create role service_role nologin;`)
  // PGlite ships gen_random_uuid() built in but not the pgcrypto extension.
  await db.exec(read('schema.sql').replace('create extension if not exists pgcrypto;', ''))
  await db.exec(read('seed.sql'))
}, 30_000)

afterAll(() => db.close())

it('seeds resources, bundles and their membership', async () => {
  expect(await count('public.products')).toBeGreaterThan(0)
  expect(await count('public.bundles')).toBeGreaterThan(0)
  // Every bundle contains something: an empty one would be an unsellable page.
  expect(await count(`public.bundles b where not exists (select 1 from public.bundle_products bp where bp."bundleId" = b.id)`)).toBe(0)
})

it('publishes what it puts on sale, so the public catalogue is not empty', async () => {
  expect(await count('public.catalog_products')).toBe(await count(`public.products where status = 'published'`))
  expect(await count('public.catalog_bundles')).toBe(await count(`public.bundles where status = 'published'`))
  expect(await count('public.catalog_faqs')).toBeGreaterThan(0)
  // Nothing is left half-way: every seeded row is either live or a draft.
  expect(await count(`public.products where status not in ('published', 'draft')`)).toBe(0)
})

it('only uses value lists the schema still knows', async () => {
  expect(await count(`public.value_lists where key = 'productKinds'`)).toBe(0)
})

it('is safe to re-run on a seeded database', async () => {
  const before = await count('public.catalog_products')
  await db.exec(read('seed.sql'))
  expect(await count('public.catalog_products')).toBe(before)
  expect(await count(`public.products where status = 'queued'`)).toBe(0)
})
