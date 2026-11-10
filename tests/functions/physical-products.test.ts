import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { customizationRulesValidation } from '../../packages/cms/src/lib/physical-products.ts'

/*
 * Physical product data foundation. The legacy database is stopped before
 * the physical section of schema.sql, populated with a published digital
 * product, then migrated. A second database loads the complete fresh schema
 * and re-applies the patch to check clean-schema parity and rerunnability.
 * These tests intentionally do not enable physical checkout or reservations.
 */

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
const schema = read('schema.sql')
const marker = '-- BEGIN physical product foundation'
const markerIndex = schema.indexOf(marker)
if (markerIndex < 0) throw new Error(`Missing schema marker: ${marker}`)
const prePhysicalSchema = schema.slice(0, markerIndex)
const patch = read('patch/2026-11-10-physical-product-foundation.sql')
const legacyDb = new PGlite()
const freshDb = new PGlite()
const LEGACY_DIGITAL = '00000000-0000-4000-8000-000000000101'
const DIGITAL = '00000000-0000-4000-8000-000000000102'
const PHYSICAL = '00000000-0000-4000-8000-000000000103'
const VARIANT = '00000000-0000-4000-8000-000000000104'
const BUNDLE = '00000000-0000-4000-8000-000000000105'
const CUSTOMER = '00000000-0000-4000-8000-000000000106'
const ADMIN = '00000000-0000-4000-8000-000000000110'
let existingProductAcl: Record<string, boolean> | undefined

const setup = async (db: PGlite) => {
  await db.exec(`create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    grant usage on schema auth to anon, authenticated, service_role;`)
}
const one = async <T>(db: PGlite, sql: string, params?: unknown[]) => (await db.query<T>(sql, params)).rows[0]

beforeAll(async () => {
  await setup(legacyDb)
  await legacyDb.exec(prePhysicalSchema.replace('create extension if not exists pgcrypto;', ''))
  await legacyDb.exec(`insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat",subjects,"purchasedFiles",status)
    values ('${LEGACY_DIGITAL}','legacy-resource','Legacy resource',30,'Grade 4','Term 1','2026','Summary','{}',
      '[{"id":"f1","label":"Pack","filename":"pack.pdf","storageKey":"private/pack.pdf"}]','queued');
    select public.publish_site_content();`)
  existingProductAcl = await one(legacyDb, `select
    has_table_privilege('anon','public.products','select') as anon_select,
    has_table_privilege('authenticated','public.products','select') as authenticated_select,
    has_table_privilege('authenticated','public.products','delete') as authenticated_delete,
    has_table_privilege('service_role','public.products','select') as service_select`)
  await legacyDb.exec(`alter default privileges in schema public grant all on tables to anon, authenticated, service_role`)
  await legacyDb.exec(patch)
  await legacyDb.exec(patch)
  await legacyDb.exec(`insert into auth.users (id,email) values
    ('${CUSTOMER}','customer@example.com'),('${ADMIN}','admin@example.com');
    update public.user_roles set role='admin' where "userId"='${ADMIN}';`)

  await setup(freshDb)
  await freshDb.exec(schema.replace('create extension if not exists pgcrypto;', ''))
  await freshDb.exec(patch)
}, 60_000)

beforeEach(async () => {
  await legacyDb.exec(`reset role; reset request.jwt.claim.sub;
    update public.product_inventory set "onHand"=0;`)
})

afterAll(async () => {
  await legacyDb.close()
  await freshDb.close()
})

describe('migration and compatibility', () => {
  it('backfills existing records as digital and keeps legacy live copies visible', async () => {
    expect(await one(legacyDb, `select "productType", grade, term, year, "resourceFormat", subjects from public.products where id='${LEGACY_DIGITAL}'`)).toEqual({
      productType: 'digital', grade: 'Grade 4', term: 'Term 1', year: '2026', resourceFormat: 'Summary', subjects: [],
    })
    expect(await one(legacyDb, `select id, slug from public.catalog_products where id='${LEGACY_DIGITAL}'`)).toEqual({
      id: LEGACY_DIGITAL, slug: 'legacy-resource',
    })
  })

  it('accepts an empty subject list for digital products as before', async () => {
    await legacyDb.exec(`insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat",subjects,status)
      values ('${DIGITAL}','digital-empty-subjects','Digital empty subjects',30,'Grade 4','Term 1','2026','Summary','{}','queued')`)
    expect(await one(legacyDb, `select cardinality(subjects)::int as count from public.products where id='${DIGITAL}'`)).toEqual({ count: 0 })
  })

  it('keeps the explicit public product row shape unchanged', async () => {
    const columns = await legacyDb.query<{ column_name: string }>(`select column_name from information_schema.columns
      where table_schema='public' and table_name='catalog_products' order by ordinal_position`)
    expect(columns.rows.map((row) => row.column_name)).not.toContain('productType')
    expect(columns.rows.map((row) => row.column_name)).not.toContain('customizationRules')
    expect(columns.rows.map((row) => row.column_name)).not.toContain('weightGrams')
  })

  it('keeps fresh schema and incremental patch in sync', async () => {
    expect(await one(freshDb, `select column_default is not null as has_default, is_nullable from information_schema.columns
      where table_schema='public' and table_name='products' and column_name='productType'`)).toEqual({ has_default: true, is_nullable: 'NO' })
    expect(await one(freshDb, `select count(*)::int as count from information_schema.tables
      where table_schema='public' and table_name in ('product_variants','product_inventory')`)).toEqual({ count: 2 })
  })

  it('overrides broad default table ACLs only for the new physical tables', async () => {
    const productAcl = await one(legacyDb, `select
      has_table_privilege('anon','public.products','select') as anon_select,
      has_table_privilege('authenticated','public.products','select') as authenticated_select,
      has_table_privilege('authenticated','public.products','delete') as authenticated_delete,
      has_table_privilege('service_role','public.products','select') as service_select`)
    expect(productAcl).toEqual(existingProductAcl)
    expect(await one(legacyDb, `select
      has_table_privilege('anon','public.product_variants','select') as anon_select,
      has_table_privilege('anon','public.product_inventory','insert') as anon_insert,
      has_table_privilege('authenticated','public.product_variants','select') as authenticated_select,
      has_table_privilege('authenticated','public.product_variants','delete') as authenticated_delete,
      has_table_privilege('service_role','public.product_inventory','update') as service_update,
      has_table_privilege('service_role','public.product_inventory','delete') as service_delete`)).toEqual({
      anon_select: false, anon_insert: false, authenticated_select: true, authenticated_delete: false, service_update: true, service_delete: false,
    })
  })
})

describe('physical product data', () => {
  it('creates and publishes a physical product without fabricated education fields, but never lists it publicly', async () => {
    await legacyDb.exec(`insert into public.products (id,slug,title,"priceZar","productType",status)
      values ('${PHYSICAL}','gift-bags','Gift bags',165,'physical','queued')`)
    expect(await one(legacyDb, `select grade,term,year,"resourceFormat",subjects,marks,"customizationRules" from public.products where id='${PHYSICAL}'`)).toEqual({
      grade: null, term: null, year: null, resourceFormat: null, subjects: [], marks: null, customizationRules: [],
    })
    await legacyDb.query(`insert into public.product_variants (id,"productId","optionValues","unitPriceZar") values ($1,$2,$3,$4)`, [
      VARIANT, PHYSICAL, { size: 'Small' }, 165,
    ])
    await legacyDb.exec(`select public.publish_site_content()`)
    expect(await one(legacyDb, `select status, live->>'productType' as live_type from public.products where id='${PHYSICAL}'`)).toEqual({
      status: 'published', live_type: 'physical',
    })
    expect(await one(legacyDb, `select live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)).toEqual({ live_price: '165.00' })
    expect(await one(legacyDb, `select count(*)::int as count from public.catalog_products where id='${PHYSICAL}'`)).toEqual({ count: 0 })
  })

  it('keeps inventory operational and separate from published variant content', async () => {
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 0 })
    await legacyDb.exec(`update public.product_inventory set "onHand"=17 where "variantId"='${VARIANT}'`)
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 17 })
    expect(await one(legacyDb, `select live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)).toEqual({ live_price: '165.00' })
    expect(await one(legacyDb, `select status from public.products where id='${PHYSICAL}'`)).toEqual({ status: 'published' })
  })

  it('queues variant content edits and snapshots them only when the product publishes', async () => {
    await legacyDb.exec(`update public.product_variants set "unitPriceZar"=235 where id='${VARIANT}'`)
    expect(await one(legacyDb, `select status from public.products where id='${PHYSICAL}'`)).toEqual({ status: 'queued' })
    expect(await one(legacyDb, `select live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)).toEqual({ live_price: '165.00' })
    await legacyDb.exec(`select public.publish_site_content()`)
    expect(await one(legacyDb, `select live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)).toEqual({ live_price: '235.00' })
  })

  it('keeps a published variant attached to its original product', async () => {
    const otherProduct = '00000000-0000-4000-8000-000000000112'
    await legacyDb.exec(`insert into public.products (id,slug,title,"priceZar","productType",status)
      values ('${otherProduct}','other-physical','Other physical',10,'physical','draft')`)
    const before = await one(legacyDb, `select "productId",live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)
    await expect(legacyDb.query(`update public.product_variants set "productId"=$1 where id=$2`, [otherProduct, VARIANT])).rejects.toThrow(/Variant product is immutable/)
    expect(await one(legacyDb, `select "productId",live->>'unitPriceZar' as live_price from public.product_variants where id='${VARIANT}'`)).toEqual(before)
    expect(await one(legacyDb, `select status from public.products where id='${PHYSICAL}'`)).toEqual({ status: 'published' })
  })

  it('rejects variants on digital products and prevents physical bundle membership', async () => {
    await expect(legacyDb.query(`insert into public.product_variants ("productId") values ($1)`, [LEGACY_DIGITAL])).rejects.toThrow(/physical products/)
    await legacyDb.exec(`insert into public.bundles (id,slug,title,"priceZar",grade,term,year,status)
      values ('${BUNDLE}','digital-bundle','Digital bundle',20,'Grade 4','Term 1','2026','queued')`)
    await expect(legacyDb.query(`insert into public.bundle_products ("bundleId","productId") values ($1,$2)`, [BUNDLE, PHYSICAL])).rejects.toThrow(/digital products/)
  })

  it('keeps product type immutable so existing paid digital orders retain their files', async () => {
    const orderId = '00000000-0000-4000-8000-000000000111'
    await legacyDb.exec(`insert into public.orders (id,reference,"customerId","customerName","customerEmail",status,items,"totalZar")
      values ('${orderId}','DM-legacy-download','${CUSTOMER}','Customer','customer@example.com','paid',
        '[{"productSlug":"legacy-resource","productKind":"Single","priceZar":30}]',30)`)
    await expect(legacyDb.query(`update public.products set "productType"='physical' where id=$1`, [LEGACY_DIGITAL])).rejects.toThrow(/Product type is immutable/)
    expect(await one(legacyDb, `select "productType",status,"purchasedFiles" from public.products where id='${LEGACY_DIGITAL}'`)).toMatchObject({
      productType: 'digital', status: 'published', purchasedFiles: [{ storageKey: 'private/pack.pdf' }],
    })
    expect(await one(legacyDb, `select status,items->0->>'productSlug' as slug from public.orders where id='${orderId}'`)).toEqual({ status: 'paid', slug: 'legacy-resource' })
  })

  it('rejects physical orders through quote, create, and the low-level order writer before and after publish', async () => {
    const slug = 'physical-sale-guard'
    const orderItems = JSON.stringify([{ productSlug: slug, productKind: 'Single', productType: 'physical', priceZar: 50 }])
    await legacyDb.exec(`insert into public.products (slug,title,"priceZar","productType",status)
      values ('${slug}','Physical sale guard',50,'physical','draft')`)

    const quote = () => legacyDb.query(`select public.quote_promotional_order($1, $2, null)`, [CUSTOMER, [slug]])
    const create = () => legacyDb.query(`select public.create_promotional_order($1,$2,null,$3,null)`, [CUSTOMER, [slug], 'DM-physical-guard'])
    const directOrder = () => legacyDb.query(`select public.create_pending_order($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`, [
      '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000108', 'DM-physical-direct', CUSTOMER,
      'Customer', 'customer@example.com', orderItems, 50,
    ])
    const assertRejected = async () => {
      await legacyDb.exec('set role service_role')
      try {
        await expect(quote()).rejects.toThrow(/unavailable/)
        await expect(create()).rejects.toThrow(/unavailable/)
        await expect(directOrder()).rejects.toThrow(/Physical products cannot be ordered/)
      } finally {
        await legacyDb.exec('reset role')
      }
      expect(await one(legacyDb, `select count(*)::int as count from public.orders where reference in ('DM-physical-guard','DM-physical-direct')`)).toEqual({ count: 0 })
    }

    await assertRejected()
    await legacyDb.exec(`update public.products set status='queued' where slug='${slug}'; select public.publish_site_content()`)
    await assertRejected()
  })

  it('allows physical products to carry real educational classification when applicable', async () => {
    const id = '00000000-0000-4000-8000-000000000109'
    await legacyDb.exec(`insert into public.products (id,slug,title,"priceZar","productType",grade,term,year,"resourceFormat",subjects,marks,status)
      values ('${id}','physical-classified','Physical classified',20,'physical','Grade 4','Term 1','2026','Summary','{"Mathematics"}',10,'draft')`)
    expect(await one(legacyDb, `select grade,term,year,"resourceFormat",subjects,marks from public.products where id='${id}'`)).toEqual({
      grade: 'Grade 4', term: 'Term 1', year: '2026', resourceFormat: 'Summary', subjects: ['Mathematics'], marks: 10,
    })
  })

  it('enforces nonnegative integer inventory, with zero representing out of stock', async () => {
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 0 })
    await legacyDb.exec(`update public.product_inventory set "onHand"=0 where "variantId"='${VARIANT}'`)
    await expect(legacyDb.query(`update public.product_inventory set "onHand"=$1 where "variantId"=$2`, [-1, VARIANT])).rejects.toThrow()
    await expect(legacyDb.query(`update public.product_inventory set "onHand"=$1 where "variantId"=$2`, [1.5, VARIANT])).rejects.toThrow()
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 0 })
  })

  it('keeps variant and stock reads private to an admin or service role', async () => {
    const hasPrivilege = async (role: string, table: string, privilege: string) =>
      one<{ allowed: boolean }>(legacyDb, `select has_table_privilege($1,$2,$3) as allowed`, [role, table, privilege])
    expect(await hasPrivilege('anon', 'public.product_inventory', 'select')).toEqual({ allowed: false })
    expect(await hasPrivilege('authenticated', 'public.product_inventory', 'select')).toEqual({ allowed: true })

    await legacyDb.exec('set role anon')
    await expect(legacyDb.query(`select * from public.product_inventory`)).rejects.toThrow(/permission denied/)
    await legacyDb.exec('reset role')

    await legacyDb.exec(`set request.jwt.claim.sub='${CUSTOMER}'; set role authenticated`)
    expect(await one(legacyDb, `select count(*)::int as count from public.product_inventory`)).toEqual({ count: 0 })
    expect((await legacyDb.query(`update public.product_inventory set "onHand"=22 where "variantId"=$1 returning "onHand"`, [VARIANT])).rows).toEqual([])
    await legacyDb.exec('reset role; reset request.jwt.claim.sub')
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 0 })

    await legacyDb.exec(`set request.jwt.claim.sub='${ADMIN}'; set role authenticated`)
    expect(await one(legacyDb, `select count(*)::int as count from public.product_inventory`)).toEqual({ count: 1 })
    await legacyDb.exec(`update public.product_inventory set "onHand"=17 where "variantId"='${VARIANT}'`)
    await legacyDb.exec('reset role; reset request.jwt.claim.sub')
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 17 })

    await legacyDb.exec('set role service_role')
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 17 })
    await legacyDb.exec(`update public.product_inventory set "onHand"=18 where "variantId"='${VARIANT}'`)
    await legacyDb.exec('reset role')
    expect(await one(legacyDb, `select "onHand" from public.product_inventory where "variantId"='${VARIANT}'`)).toEqual({ onHand: 18 })
  })
})

describe('physical field validation', () => {
  it('requires digital classification fields, and enforces physical measurements as positive nullable units', async () => {
    await expect(legacyDb.query(`insert into public.products (slug,title,"priceZar","productType") values ('bad-digital','Bad digital',10,'digital')`)).rejects.toThrow()
    await expect(legacyDb.query(`insert into public.products (slug,title,"priceZar","productType","weightGrams") values ('bad-weight','Bad weight',10,'physical',0)`)).rejects.toThrow()
    await expect(legacyDb.query(`insert into public.products (slug,title,"priceZar","productType","purchasedFiles") values ('physical-files','Physical files',10,'physical','[{"id":"f"}]')`)).rejects.toThrow()
  })

  it('validates configurable rule structure without seeding a rule or imposing name limits', async () => {
    expect(await one(legacyDb, `select private.valid_customization_rules('[]'::jsonb) as ok`)).toEqual({ ok: true })
    expect(await one(legacyDb, `select private.valid_customization_rules($1::jsonb) as ok`, [JSON.stringify([
      { key: 'name', label: 'Name', type: 'text', required: true, constraints: { allowedCharacters: 'A🙂', allowSpaces: true } },
      { key: 'colour', label: 'Colour', type: 'select', required: true, options: ['Pink', 'Blue'] },
    ])])).toEqual({ ok: true })
    const invalid = [
      [{ key: 'name', label: 'Name', type: 'text', required: true, options: ['A'] }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: true, constraints: {} , options: ['Pink'] }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { minLength: 4, maxLength: 2 } }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: true, options: ['Pink', 'Pink'] }],
      [{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'name', label: 'Name again', type: 'text', required: false }],
      [{ key: '   ', label: 'Name', type: 'text', required: true }],
    ]
    for (const rules of invalid) {
      expect(await one(legacyDb, `select private.valid_customization_rules($1::jsonb) as ok`, [JSON.stringify(rules)])).toEqual({ ok: false })
    }
  })

  it('keeps SQL configuration validation aligned with the shared CMS validator', async () => {
    const corpus: unknown[] = [
      [],
      null,
      undefined,
      {},
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { allowedCharacters: 'AB🙂', allowSpaces: true } }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: false, options: ['Pink', 'Blue'] }],
      [{ key: 'name', label: '\t\u00a0', type: 'text', required: true }],
      [{ key: '\u202f', label: 'Name', type: 'text', required: true }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: true }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: true, options: ['Pink', 'Pink'] }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, options: ['A'] }],
      [{ key: 'colour', label: 'Colour', type: 'select', required: true, constraints: {}, options: ['Pink'] }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { minLength: 4, maxLength: 2 } }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { minLength: 1.5 } }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { maxLength: -1 } }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { maxLength: 2147483648 } }],
      [{ key: 'name', label: 'Name', type: 'text', required: true, unexpected: true }],
      [{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'name', label: 'Name again', type: 'text', required: false }],
    ]
    for (const rules of corpus) {
      const sqlValue = rules === undefined ? null : JSON.stringify(rules)
      const sqlResult = await one<{ valid: boolean }>(legacyDb, `select private.valid_customization_rules($1::jsonb) as valid`, [sqlValue])
      expect(sqlResult?.valid, JSON.stringify(rules)).toBe(customizationRulesValidation(rules) === null)
    }
    expect(await one(legacyDb, `select private.valid_customization_rules(null::jsonb) as valid`)).toEqual({ valid: false })
  })

  it('rejects invalid configuration at the product row boundary', async () => {
    await expect(legacyDb.query(`insert into public.products (slug,title,"priceZar","productType","customizationRules") values ($1,$2,10,'physical',$3::jsonb)`, [
      'bad-rules', 'Bad rules', JSON.stringify([{ key: 'name', label: 'Name', type: 'text', required: true, options: [] }]),
    ])).rejects.toThrow(/customization_rules/)
  })
})
