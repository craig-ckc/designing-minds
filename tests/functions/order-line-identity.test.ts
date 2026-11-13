import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/* Order lines used to be keyed only by slug. These prove, against real
   Postgres (PGlite), that new lines carry ids, that ownership follows a
   renamed resource through the slug history, and that a retired slug cannot
   be handed to a different record. */

const db = new PGlite()
const customer = '00000000-0000-4000-8000-0000000000aa'
const product = '00000000-0000-4000-8000-000000000001'
const bundle = '00000000-0000-4000-8000-000000000002'
const newcomer = '00000000-0000-4000-8000-000000000003'
const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const query = async (sql: string, args: unknown[] = []) => (await db.query<{ r: any }>(sql, args)).rows[0]?.r
const quote = (slugs: string[]) => query('select public.quote_promotional_order($1::uuid, $2::text[], null) as r', [customer, slugs])
const paidOrder = (items: unknown[], placedAt = '2026-10-01T10:00:00Z') => db.query(
  `insert into public.orders (reference,"customerId","customerName","customerEmail",status,items,"totalZar","placedAt")
   values ($1,$2,'A','a@example.com','paid',$3::jsonb,100,$4::timestamptz)`, [`DM-${crypto.randomUUID()}`, customer, JSON.stringify(items), placedAt])

beforeAll(async () => {
  await db.exec(`create schema auth; create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated; create role service_role; grant usage on schema auth to authenticated;`)
  await db.exec(read('schema.sql').replace('create extension if not exists pgcrypto;', ''))
  // Re-running the patch over the fresh schema must be harmless.
  await db.exec(read('patch/2026-11-12-order-line-identity.sql'))
  await db.exec(`insert into auth.users (id,email) values ('${customer}','a@example.com');`)
}, 30000)

beforeEach(async () => {
  await db.exec(`truncate public.coupon_redemptions, public.payments, public.orders, public.slug_redirects, public.cart_items, public.carts, public.bundle_products, public.bundles, public.products cascade;
    insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat",status)
      values ('${product}','maths','Maths',100,'Grade 4','Term 1','2026','Test / Assessment','queued');
    insert into public.bundles (id,slug,title,"priceZar",grade,term,year,status)
      values ('${bundle}','pack','Pack',200,'Grade 4','Term 1','2026','queued');
    select public.publish_site_content();`)
})
afterAll(() => db.close())

describe('order line identity', () => {
  it('records the product or bundle id on every new digital line', async () => {
    const result = await quote(['maths', 'pack'])
    const lines = Object.fromEntries(result.items.map((line: Record<string, string>) => [line.productSlug, line]))
    expect(lines.maths.productId).toBe(product)
    expect(lines.maths.bundleId).toBeUndefined()
    expect(lines.pack.bundleId).toBe(bundle)
  })

  it('still treats a resource as owned after its slug changes', async () => {
    await paidOrder([{ productSlug: 'maths', productKind: 'Single', priceZar: 100 }])
    await db.exec(`update public.products set slug='maths-2026', status='queued' where id='${product}'; select public.publish_site_content();`)
    await expect(quote(['maths-2026'])).rejects.toThrow(/already owns/)
  })

  it('treats an id-carrying line as owned whatever its slug says', async () => {
    await paidOrder([{ productSlug: 'something-old', productId: bundle, productKind: 'Bundle', priceZar: 200 }].map((line) => ({ ...line, productId: undefined, bundleId: bundle })))
    await expect(quote(['pack'])).rejects.toThrow(/already owns/)
    await expect(quote(['maths'])).resolves.toMatchObject({ totalZar: 100 })
  })

  it('ignores physical lines when deciding ownership', async () => {
    await paidOrder([{ productSlug: 'maths', productType: 'physical', productKind: 'Physical', priceZar: 100 }])
    await expect(quote(['maths'])).resolves.toMatchObject({ totalZar: 100 })
  })

  it('resolves a legacy slug placed after an older rename to the record now using it', async () => {
    const resolved = await query(`select to_jsonb(e) as r from private.order_line_entity('{"productSlug":"maths"}'::jsonb, now() + interval '1 day') e`)
    expect(resolved).toEqual({ kind: 'product', entity_id: product })
  })

  it('refuses to give a retired slug to a different record, but lets the original take it back', async () => {
    await db.exec(`update public.products set slug='maths-2026' where id='${product}'`)
    await expect(db.exec(`insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat")
      values ('${newcomer}','maths','New',50,'Grade 4','Term 1','2026','Summary')`)).rejects.toThrow(/belonged to another product/)
    await expect(db.exec(`update public.bundles set slug='maths' where id='${bundle}'`)).rejects.toThrow(/belonged to another product/)
    await db.exec(`update public.products set slug='maths' where id='${product}'`)
    expect(await query(`select slug as r from public.products where id='${product}'`)).toBe('maths')
  })

  it('clears purchased cart lines by id even when the slug has changed since checkout', async () => {
    await db.exec(`insert into public.carts (id,"customerId") values ('00000000-0000-4000-8000-0000000000c1','${customer}');
      insert into public.cart_items ("cartId","productId") values ('00000000-0000-4000-8000-0000000000c1','${product}');
      insert into public.cart_items ("cartId","bundleId") values ('00000000-0000-4000-8000-0000000000c1','${bundle}');`)
    await paidOrder([{ productSlug: 'renamed-since', productId: product, productKind: 'Single', priceZar: 100 }])
    expect(await query('select count(*)::int as r from public.cart_items')).toBe(1)
  })

  it('lets the download functions read slug history', async () => {
    expect(await query(`select has_table_privilege('service_role','public.slug_redirects','select') as r`)).toBe(true)
  })

  it('still saves a record that already reused a retired slug before this patch (admin upsert)', async () => {
    await db.exec(`update public.products set slug='maths-2026' where id='${product}';
      alter table public.products disable trigger products_guard_retired_slug;
      insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat") values ('${newcomer}','maths','New',50,'Grade 4','Term 1','2026','Summary');
      alter table public.products enable trigger products_guard_retired_slug;`)
    await db.exec(`insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat") values ('${newcomer}','maths','New edition',50,'Grade 4','Term 1','2026','Summary')
      on conflict (id) do update set title=excluded.title`)
    expect(await query(`select title as r from public.products where id='${newcomer}'`)).toBe('New edition')
  })
})
