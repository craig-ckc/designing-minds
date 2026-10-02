import { expect, it, vi } from 'vitest'
vi.mock('../../apps/admin/src/lib/supabase.ts', () => ({ supabase: {} }))
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import { createBlank, selectRecords, createAdminAdapter, isDeletable } from '../../apps/admin/src/cms/adapter.ts'
import { toPublicSnapshot } from '../../packages/cms/src/lib/public-snapshot.ts'
import type { CmsSnapshot, CmsRepository } from '../../packages/cms/src/types.ts'
const snapshot = { products: [], bundles: [], faqs: [], testimonials: [], customers: [], orders: [], payments: [], formContact: [], formNewsletter: [], valueLists: { grades: ['Grade 4'], terms: ['Term 1'], years: ['2026'], subjects: [], resourceFormats: [] }, stats: {}, coupons: [] } as unknown as CmsSnapshot
it('offers sale schedules on both editors and per-code sale-item controls', () => {
  for (const id of ['products','bundles']) {
    const config = collectionRegistry.find((c) => c.id === id)!
    expect(config.fields.map((f) => f.key)).toEqual(expect.arrayContaining(['salePriceZar','saleStartsAt','saleEndsAt']))
    expect(config.sections.flatMap((s) => s.fields)).toEqual(expect.arrayContaining(['salePriceZar','saleStartsAt','saleEndsAt']))
  }
  const coupons = collectionRegistry.find((c) => c.id === 'coupons')!
  expect(coupons.statusField).toBeUndefined()
  expect(coupons.fields.map((f) => f.key)).toEqual(expect.arrayContaining(['allowSaleItems','expiresAt','discountType','value','enabled']))
})
it('creates disabled codes with combining off and retains history by disabling instead of deleting', () => {
  expect(createBlank(snapshot,'coupons')).toMatchObject({ enabled: false, allowSaleItems: false })
  expect(isDeletable('coupons')).toBe(false)
})
it('saves and shows codes in the admin without including them in the public snapshot', async () => {
  const code = { ...createBlank(snapshot,'coupons'), code: 'SAVE10', value: 10 }
  const repository = { canWrite: true, saveCoupon: vi.fn().mockResolvedValue(code) } as unknown as CmsRepository
  const result = await createAdminAdapter(repository).save('coupons',code)
  const next = result.apply(snapshot)
  expect(selectRecords(next,'coupons')).toEqual([code])
  expect(toPublicSnapshot(next)).not.toHaveProperty('coupons')
})
