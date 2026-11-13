import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, it } from 'vitest'
import { createSupabaseRepository } from '../../packages/cms/src/providers/supabase.ts'
import { toPublicSnapshot } from '../../packages/cms/src/lib/public-snapshot.ts'
import type { PhysicalProduct } from '../../packages/cms/src/lib/physical-products.ts'
import type { Product } from '../../packages/cms/src/types.ts'
import { makeProduct, makeSnapshot } from '../support/fixtures.ts'

const physical = (): PhysicalProduct => ({
  ...makeProduct({ slug: 'keyring' }),
  productType: 'physical',
  published: false,
  status: 'draft',
  grade: null,
  term: null,
  year: null,
  resourceFormat: null,
  subjects: [],
  purchasedFiles: [],
  weightGrams: null,
  lengthMm: null,
  widthMm: null,
  heightMm: null,
  customizationRules: [],
  pricingMode: 'fixed',
  pricingFieldKey: null,
  billableCharacters: null,
  variantOptions: [],
  leadTimeDays: null,
  previewTemplate: null,
})

function writableRepository(error: string | null = null) {
  const writes: Record<string, unknown>[] = []
  const client = {
    async rpc(name: string, args: { p_product: Record<string, unknown>; p_variants: unknown[] }) {
      expect(name).toBe('save_physical_product')
      writes.push(args.p_product)
      expect(args.p_product).not.toHaveProperty('variants')
      return { data: { ...args.p_product, variants: args.p_variants, published: false, publishedAt: null }, error: error ? { message: error } : null }
    },
  } as unknown as SupabaseClient
  return { writes, repo: createSupabaseRepository({ audience: 'admin', client, url: '', publishableKey: '' }) }
}

it('persists an unconfigured physical draft in the existing product collection without publishing it', async () => {
  const { writes, repo } = writableRepository()
  const draft = physical()
  const saved = await repo.savePhysicalProduct({ ...draft, published: true, publishedAt: '2026-11-10' })
  expect(writes).toHaveLength(1)
  expect(writes[0]).toMatchObject({ productType: 'physical', status: 'draft', grade: null, customizationRules: [] })
  expect(writes[0]).not.toHaveProperty('published')
  expect(writes[0]).not.toHaveProperty('publishedAt')
  expect(saved.productType).toBe('physical')
  expect(saved.published).toBe(false)
  expect(saved.customizationRules).toEqual([])
})

it('rejects malformed rules and the wrong save method before writing', async () => {
  const { writes, repo } = writableRepository()
  await expect(repo.savePhysicalProduct({ ...physical(), customizationRules: [{}] } as PhysicalProduct)).rejects.toThrow()
  await expect(repo.savePhysicalProduct({ ...physical(), productType: 'digital' } as unknown as PhysicalProduct)).rejects.toThrow('physical product type')
  await expect(repo.saveProduct(physical() as unknown as Product)).rejects.toThrow('savePhysicalProduct')
  expect(writes).toEqual([])
})

it('propagates database validation and permission errors when saving physical drafts', async () => {
  const { repo } = writableRepository('permission denied')
  await expect(repo.savePhysicalProduct(physical())).rejects.toThrow('permission denied')
})

it('keeps physical drafts and their configuration out of public snapshots', () => {
  const snapshot = makeSnapshot({ physicalProducts: [physical()], products: [makeProduct({ slug: 'maths' })] })
  const published = toPublicSnapshot(snapshot)
  expect(published).not.toHaveProperty('physicalProducts')
  expect(published.products.map((product) => product.slug)).toEqual(['maths'])
})
