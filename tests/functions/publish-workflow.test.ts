import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/* -------------------------------------------------------------------------
   The publish workflow, proven against real Postgres (PGlite): schema.sql for
   a fresh project, then the 2026-10-01 patch re-applied on top to prove it is
   safe on an already-migrated database.

   The promise being tested: a Draft edit never reaches anything public — the
   catalogue views, and so the cart and checkout — until it is queued AND
   published; and nothing but publish_site_content() can change what is live.
   ------------------------------------------------------------------------- */

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
const db = new PGlite()
const ADMIN = '00000000-0000-4000-8000-0000000000aa'
const PRODUCT = '00000000-0000-4000-8000-000000000001'
const OTHER = '00000000-0000-4000-8000-000000000002'
const BUNDLE = '00000000-0000-4000-8000-0000000000b1'

const rows = async <T>(sql: string) => (await db.query<T>(sql)).rows
const one = async <T>(sql: string) => (await rows<T>(sql))[0]
const publish = () => one<{ r: { promoted: number; removed: number } }>('select public.publish_site_content() as r')

beforeAll(async () => {
  await db.exec(`create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon nologin; create role authenticated nologin; create role service_role nologin;`)
  // PGlite ships gen_random_uuid() built in but not the pgcrypto extension.
  await db.exec(read('schema.sql').replace('create extension if not exists pgcrypto;', ''))
  await db.exec(read('patch/2026-10-01-publish-workflow.sql'))
  await db.exec(`insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com');
    update public.user_roles set role = 'admin' where "userId" = '${ADMIN}';`)
}, 30_000)

beforeEach(async () => {
  await db.exec(`reset role; truncate public.bundle_products, public.bundles, public.products, public.faqs, public.testimonials cascade;
    insert into public.products (id, slug, title, "priceZar", grade, term, year, "resourceFormat", status, "purchasedFiles")
    values ('${PRODUCT}', 'fractions', 'Fractions', 10, 'Grade 4', 'Term 1', '2026', 'Worksheet', 'queued',
            '[{"id":"f1","label":"Pack","filename":"pack.pdf","storageKey":"private/pack.pdf"}]'),
           ('${OTHER}', 'decimals', 'Decimals', 20, 'Grade 4', 'Term 1', '2026', 'Worksheet', 'queued', '[]');
    insert into public.bundles (id, slug, title, "priceZar", grade, term, year, status)
    values ('${BUNDLE}', 'term-pack', 'Term pack', 25, 'Grade 4', 'Term 1', '2026', 'queued');
    insert into public.bundle_products values ('${BUNDLE}', '${PRODUCT}', 1);
    insert into public.faqs (question, answer, status) values ('Is it CAPS aligned?', 'Yes', 'queued');`)
  await publish()
})

afterAll(() => db.close())

describe('editing', () => {
  it('keeps the live copy while a published record is edited as a Draft', async () => {
    await db.exec(`update public.products set "priceZar" = 99, title = 'Fractions v2', status = 'draft' where id = '${PRODUCT}'`)
    expect(await one(`select "priceZar", title from public.catalog_products where id = '${PRODUCT}'`)).toEqual({
      priceZar: '10.00',
      title: 'Fractions',
    })
    expect(await one(`select status, published from public.products where id = '${PRODUCT}'`)).toEqual({
      status: 'draft',
      published: true,
    })
  })

  it('keeps a Queued edit off the site until publish, then serves it', async () => {
    await db.exec(`update public.products set "priceZar" = 15, status = 'queued' where id = '${PRODUCT}'`)
    expect((await one<{ priceZar: string }>(`select "priceZar" from public.catalog_products where id = '${PRODUCT}'`)).priceZar).toBe('10.00')
    expect((await publish()).r.promoted).toBe(1)
    expect(await one(`select "priceZar", status from public.catalog_products where id = '${PRODUCT}'`)).toEqual({
      priceZar: '15.00',
      status: 'published',
    })
    expect((await one<{ status: string }>(`select status from public.products where id = '${PRODUCT}'`)).status).toBe('published')
  })

  it('demotes a changed record that claims to be Published to Queued', async () => {
    await db.exec(`update public.products set "priceZar" = 1, status = 'published' where id = '${PRODUCT}'`)
    expect((await one<{ status: string }>(`select status from public.products where id = '${PRODUCT}'`)).status).toBe('queued')
  })

  it('leaves an unchanged Published record Published when it is saved again', async () => {
    await db.exec(`update public.faqs set status = 'published'`)
    expect((await one<{ status: string }>('select status from public.faqs')).status).toBe('published')
  })

  it('never lets an editor write the live copy or the published flag', async () => {
    await db.exec(`update public.faqs set live = '{"question":"hacked"}', published = false, "publishedAt" = null`)
    expect(await one('select live ->> \'question\' as question, published, "publishedAt" is not null as stamped from public.faqs')).toEqual({
      question: 'Is it CAPS aligned?',
      published: true,
      stamped: true,
    })
  })

  it('creates new records without a live copy, even when they claim to be Published', async () => {
    await db.exec(`insert into public.faqs (question, status, published, live) values ('New', 'published', true, '{"question":"x"}')`)
    expect(await one(`select status, published, live from public.faqs where question = 'New'`)).toEqual({
      status: 'queued',
      published: false,
      live: null,
    })
  })

  it('does not bump updatedAt when publishing', async () => {
    await db.exec(`update public.products set status = 'queued' where id = '${PRODUCT}'`)
    const before = await one<{ updatedAt: Date }>(`select "updatedAt" from public.products where id = '${PRODUCT}'`)
    await publish()
    const after = await one<{ updatedAt: Date }>(`select "updatedAt" from public.products where id = '${PRODUCT}'`)
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime())
  })
})

describe('archiving', () => {
  it('keeps an Archived record live until the next publish, then removes it', async () => {
    await db.exec(`update public.faqs set status = 'archived'`)
    expect((await one<{ count: number }>('select count(*)::int as count from public.catalog_faqs')).count).toBe(1)
    expect((await publish()).r.removed).toBe(1)
    expect((await one<{ count: number }>('select count(*)::int as count from public.catalog_faqs')).count).toBe(0)
    expect(await one('select status, published, live from public.faqs')).toEqual({ status: 'archived', published: false, live: null })
  })

  it('treats a publish with nothing queued or archived as a no-op', async () => {
    expect((await publish()).r).toMatchObject({ promoted: 0, removed: 0 })
  })
})

describe('the public catalogue', () => {
  it('strips storage keys from purchased files', async () => {
    const { purchasedFiles } = await one<{ purchasedFiles: unknown }>(`select "purchasedFiles" from public.catalog_products where id = '${PRODUCT}'`)
    expect(purchasedFiles).toEqual([{ id: 'f1', label: 'Pack', filename: 'pack.pdf' }])
  })

  it('lists bundle members as frozen at publish, narrowed to live resources', async () => {
    expect((await one<{ includedProductSlugs: string[] }>('select "includedProductSlugs" from public.catalog_bundles')).includedProductSlugs).toEqual(['fractions'])

    // A membership change on a Published bundle re-queues it; the site keeps the old set.
    await db.exec(`set request.jwt.claim.sub = '${ADMIN}'`)
    await db.query(`select public.set_bundle_products($1::uuid, $2::uuid[])`, [BUNDLE, [PRODUCT, OTHER]])
    await db.exec(`reset request.jwt.claim.sub`)
    expect((await one<{ status: string }>('select status from public.bundles')).status).toBe('queued')
    expect((await one<{ includedProductSlugs: string[] }>('select "includedProductSlugs" from public.catalog_bundles')).includedProductSlugs).toEqual(['fractions'])

    await publish()
    expect((await one<{ includedProductSlugs: string[] }>('select "includedProductSlugs" from public.catalog_bundles')).includedProductSlugs).toEqual(['fractions', 'decimals'])

    // Archiving a member drops it from the bundle's public contents once published.
    await db.exec(`update public.products set status = 'archived' where id = '${OTHER}'`)
    await publish()
    expect((await one<{ includedProductSlugs: string[] }>('select "includedProductSlugs" from public.catalog_bundles')).includedProductSlugs).toEqual(['fractions'])
  })

  it('only activates a slug redirect once the new slug is live', async () => {
    await db.exec(`update public.products set slug = 'fractions-pack', status = 'draft' where id = '${PRODUCT}'`)
    expect((await one<{ count: number }>('select count(*)::int as count from public.active_slug_redirects')).count).toBe(0)
    await db.exec(`update public.products set status = 'queued' where id = '${PRODUCT}'`)
    await publish()
    expect(await rows('select "fromPath", "toPath" from public.active_slug_redirects')).toEqual([
      { fromPath: '/shop/fractions', toPath: '/shop/fractions-pack' },
    ])
  })
})

describe('permissions', () => {
  it('only lets the service role publish', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      await expect(publish()).rejects.toThrow(/permission denied/)
      await db.exec('reset role')
    }
    await db.exec('set role service_role')
    await expect(publish()).resolves.toBeTruthy()
  })

  it('serves FAQs and testimonials to visitors through the live views only', async () => {
    await db.exec(`insert into public.faqs (question, status) values ('Draft question', 'draft')`)
    // Supabase grants anon SELECT on every table and leaves the filtering to
    // RLS, so mirror that: the table must come back empty, not merely denied.
    await db.exec('grant select on public.faqs, public.testimonials to anon; set role anon')
    expect(await rows('select * from public.faqs')).toEqual([])
    expect(await rows('select * from public.testimonials')).toEqual([])
    expect(await rows('select question from public.catalog_faqs')).toEqual([{ question: 'Is it CAPS aligned?' }])
  })
})
