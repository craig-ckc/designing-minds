import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, it } from 'vitest'
import { createSupabaseRepository } from '../../packages/cms/src/providers/supabase.ts'
import { makeProduct } from '../support/fixtures.ts'

const publicTables = ['catalog_products', 'catalog_bundles', 'catalog_faqs', 'catalog_testimonials', 'value_lists', 'catalog_physical_products', 'commerce_public_context']
const privateTables = ['users', 'orders', 'payments', 'form_contact', 'form_newsletter', 'coupons']

function repository(audience: 'public' | 'admin', results: Record<string, { data: unknown; error: { code?: string; message: string } | null }> = {}) {
  const requests: string[] = []
  const client = {
    from(table: string) {
      requests.push(table)
      if (audience === 'public' && !publicTables.includes(table)) {
        throw new Error(`Public client cannot access ${table}`)
      }
      return { select: async () => results[table] ?? { data: [], error: null } }
    },
  } as unknown as SupabaseClient
  return { requests, repo: createSupabaseRepository({ audience, client, url: '', publishableKey: '' }) }
}

it('loads the public catalogue without requesting operational tables or coupons', async () => {
  const product = makeProduct({ slug: 'maths', priceZar: 100 })
  const { repo, requests } = repository('public', { catalog_products: { data: [product], error: null } })
  const snapshot = await repo.getSnapshot()

  expect(requests).toEqual(publicTables)
  expect(snapshot.products).toEqual([expect.objectContaining({ slug: 'maths', priceZar: 100 })])
  for (const key of ['customers', 'orders', 'payments', 'formContact', 'formNewsletter'] as const) {
    expect(snapshot[key]).toEqual([])
  }
  expect(snapshot).not.toHaveProperty('coupons')
  expect(snapshot).not.toHaveProperty('physicalProducts')
  expect(snapshot.stats).toMatchObject({ productCount: 1, orderCount: 0, customerCount: 0 })
})

it('still fails closed when a public catalogue query is denied', async () => {
  const { repo } = repository('public', { value_lists: { data: null, error: { message: 'permission denied for value_lists' } } })
  await expect(repo.getSnapshot()).rejects.toThrow('permission denied for value_lists')
})

it('retains operational queries and records for the admin audience', async () => {
  const customer = { id: 'customer', name: 'Customer', email: 'customer@example.test', createdAt: '2026-01-01' }
  const { repo, requests } = repository('admin', { users: { data: [customer], error: null } })
  const snapshot = await repo.getSnapshot()
  expect(requests).toEqual(expect.arrayContaining(privateTables))
  expect(snapshot.customers).toEqual([customer])
  expect(snapshot.stats.customerCount).toBe(1)
})

it('retains fatal operational query errors for the admin audience', async () => {
  const { repo } = repository('admin', { orders: { data: null, error: { message: 'permission denied for orders' } } })
  await expect(repo.getSnapshot()).rejects.toThrow('permission denied for orders')
})

it('separates physical admin drafts from digital resources and excludes them for public readers', async () => {
  const digital = makeProduct({ slug: 'maths' })
  const physical = { ...makeProduct({ slug: 'keyring' }), productType: 'physical', grade: null, customizationRules: [] }
  const admin = repository('admin', { products: { data: [digital, physical], error: null } })
  const snapshot = await admin.repo.getSnapshot()
  expect(snapshot.products.map((product) => product.slug)).toEqual(['maths'])
  expect(snapshot.physicalProducts?.map((product) => product.slug)).toEqual(['keyring'])

  const publicReader = repository('public', { catalog_products: { data: [digital, physical], error: null } })
  const published = await publicReader.repo.getSnapshot()
  expect(published.products.map((product) => product.slug)).toEqual(['maths'])
  expect(published).not.toHaveProperty('physicalProducts')
})

it('keeps digital startup working when the new commerce views are not installed', async () => {
  const { repo } = repository('public', {
    catalog_products: { data: [makeProduct({ slug: 'maths' })], error: null },
    catalog_physical_products: { data: null, error: { code: 'PGRST205', message: 'View is not installed' } },
    commerce_public_context: { data: null, error: { code: '42P01', message: 'Relation is not installed' } },
  })
  const snapshot = await repo.getSnapshot()
  expect(snapshot.products).toHaveLength(1)
  expect(snapshot.physicalCatalog).toEqual([])
  expect(snapshot.commerceReady).toBe(false)
  expect(snapshot.localCommercePreview).toBe(false)
})

it('propagates new catalogue permission failures instead of silently disabling commerce', async () => {
  const { repo } = repository('public', { catalog_physical_products: { data: null, error: { code: '42501', message: 'permission denied for physical catalogue' } } })
  await expect(repo.getSnapshot()).rejects.toThrow('permission denied for physical catalogue')
})

it('uses the server context to gate public physical listings and preview mode', async () => {
  const product = { id: 'physical', slug: 'keyring', priceZar: '30.00', salePriceZar: null, variants: [{ id: 'pink', unitPriceZar: '35.00', available: true }] }
  const enabled = repository('public', {
    catalog_physical_products: { data: [product], error: null },
    commerce_public_context: { data: [{ enabled: true, localPreview: true }], error: null },
  })
  const snapshot = await enabled.repo.getSnapshot()
  expect(snapshot.commerceReady).toBe(true)
  expect(snapshot.localCommercePreview).toBe(true)
  expect(snapshot.physicalCatalog?.[0]).toMatchObject({ priceZar: 30, variants: [{ unitPriceZar: 35 }] })
  const disabled = repository('public', {
    catalog_physical_products: { data: [product], error: null },
    commerce_public_context: { data: [{ enabled: false, localPreview: true }], error: null },
  })
  expect(await disabled.repo.getSnapshot()).toMatchObject({ physicalCatalog: [], localCommercePreview: false })
})

it('joins private variant stock into admin products without adding it to the public projection', async () => {
  const { repo } = repository('admin', {
    products: { data: [{ ...makeProduct({ slug: 'bag' }), productType: 'physical' }], error: null },
    product_variants: { data: [{ id: 'small', productId: 'bag', unitPriceZar: '165.00', live: { secret: 'live' } }], error: null },
    product_inventory: { data: [{ variantId: 'small', onHand: 17 }], error: null },
  })
  const snapshot = await repo.getSnapshot()
  expect(snapshot.physicalProducts?.[0]).toMatchObject({ pricingMode: 'fixed', variants: [{ onHand: 17, unitPriceZar: 165 }] })
  expect(snapshot.physicalProducts?.[0].variants?.[0]).not.toHaveProperty('live')
})
