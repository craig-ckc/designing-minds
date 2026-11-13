import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer, type ViteDevServer } from 'vite'
import type { CmsRepository } from '../../packages/cms/src/types.ts'
import type { PhysicalProduct } from '../../packages/cms/src/lib/physical-products.ts'
import { makeProduct, makeSnapshot } from '../support/fixtures.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import type { AdminRecord } from '../../apps/admin/src/cms/types.ts'

let server: ViteDevServer
let adapterModule: typeof import('../../apps/admin/src/cms/adapter.ts')
let rulesField: typeof import('../../apps/admin/src/components/editor/CustomizationRulesField.tsx')
let variantsField: typeof import('../../apps/admin/src/components/editor/PhysicalVariantsField.tsx')
let fulfillmentField: typeof import('../../apps/admin/src/components/editor/OrderFulfillment.tsx')
let editHelpers: typeof import('../../apps/admin/src/cms/physical-product-edit.ts')
before(async () => {
  server = await createServer({
    configFile: false, envDir: false,
    root: fileURLToPath(new URL('../../apps/admin', import.meta.url)),
    server: { middlewareMode: true, hmr: false }, appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
    plugins: [{ name: 'isolated-admin-auth', enforce: 'pre', load(id) {
      if (id.replaceAll('\\', '/').endsWith('/apps/admin/src/lib/supabase.ts')) return 'export const supabase = {}'
    } }],
  })
  adapterModule = await server.ssrLoadModule('/src/cms/adapter.ts') as typeof adapterModule
  editHelpers = await server.ssrLoadModule('/src/cms/physical-product-edit.ts') as typeof editHelpers
  rulesField = await server.ssrLoadModule('/src/components/editor/CustomizationRulesField.tsx') as typeof rulesField
  variantsField = await server.ssrLoadModule('/src/components/editor/PhysicalVariantsField.tsx') as typeof variantsField
  fulfillmentField = await server.ssrLoadModule('/src/components/editor/OrderFulfillment.tsx') as typeof fulfillmentField
})
after(async () => { await server?.close() })

const physical = (): PhysicalProduct => ({
  ...makeProduct({ slug: 'gift-bag', priceZar: 165 }), productType: 'physical', status: 'draft', published: false,
  grade: null, term: null, year: null, resourceFormat: null, subjects: [], purchasedFiles: [],
  weightGrams: null, lengthMm: null, widthMm: null, heightMm: null, customizationRules: [],
  pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
  variantOptions: [{ key: 'size', label: 'Size', values: [{ value: 'Small' }, { value: 'Large' }] }], leadTimeDays: null, previewTemplate: null,
  variants: [{ id: 'small', productId: 'gift-bag', sku: 'small', optionValues: { size: 'Small' }, unitPriceZar: null, active: true, sortOrder: 1, onHand: 17 }],
})
const asRecord = (product: PhysicalProduct) => product as unknown as AdminRecord

test('the same Products collection contains both product types, with digital-only bundle choices', () => {
  const digital = makeProduct({ slug: 'maths' })
  const snapshot = makeSnapshot({ products: [digital], physicalProducts: [physical()], commerceReady: true })
  assert.deepEqual(adapterModule.selectRecords(snapshot, 'products').map((product) => product.productType), ['digital', 'physical'])
  assert.equal(adapterModule.recordCount(snapshot, 'products'), 2)
  const choices = adapterModule.buildFieldContext(snapshot).optionsForReference({ key: 'includedProductIds', label: 'Included', type: 'multiReference', collection: 'products', valueKey: 'id' })
  assert.deepEqual(choices.map((choice) => choice.value), ['maths'])
})

test('new physical products need no invented educational fields, and digital defaults remain usable', () => {
  const snapshot = makeSnapshot()
  const draft = adapterModule.createBlank(snapshot, 'products')
  assert.equal(draft.productType, 'digital')
  const converted = editHelpers.chooseNewProductType(draft, 'physical', snapshot.valueLists, '2026')
  assert.equal(converted.grade, null)
  assert.deepEqual(converted.purchasedFiles, [])
  assert.deepEqual(converted.variants, [])
  assert.equal(converted.pricingMode, 'fixed')
  const digitalAgain = editHelpers.chooseNewProductType(converted, 'digital', snapshot.valueLists, '2026')
  assert.equal(digitalAgain.grade, 'Grade 3')
  assert.equal(digitalAgain.year, '2026')
})

test('physical saves use the atomic repository method and update only the physical snapshot slice', async () => {
  const saved = physical()
  let writes = 0
  const repository = { canWrite: true, savePhysicalProduct: async (product: PhysicalProduct) => { writes++; assert.equal(product, saved); return product }, saveProduct: () => { throw new Error('Digital save must not receive physical products') } } as unknown as CmsRepository
  const result = await adapterModule.createAdminAdapter(repository).save('products', asRecord(saved))
  const digital = makeProduct({ slug: 'maths' })
  const next = result.apply(makeSnapshot({ products: [digital] }))
  assert.equal(writes, 1)
  assert.deepEqual(next.products, [digital])
  assert.deepEqual(next.physicalProducts, [saved])
})

test('physical validation rejects invalid quantities, pricing, missing publish options and malformed questions', () => {
  const { physicalProductEditValidation } = editHelpers
  assert.equal(physicalProductEditValidation(asRecord(physical())), null)
  for (const quantity of [-1, 1.5, Number.NaN, 2_147_483_648]) {
    const record = physical(); record.variants![0].stockAdjustment = { expectedOnHand: 17, newOnHand: quantity }
    assert.match(physicalProductEditValidation(asRecord(record)) ?? '', /Stock must/)
  }
  assert.match(physicalProductEditValidation(asRecord({ ...physical(), status: 'queued', variants: [] })) ?? '', /available product option/)
  assert.match(physicalProductEditValidation(asRecord({ ...physical(), pricingMode: 'per_character' })) ?? '', /Name pricing requires/)
  assert.match(physicalProductEditValidation({ ...asRecord(physical()), customizationRules: [{}] }) ?? '', /rule/)
})

test('duplicating a physical record creates new variant identities and never copies stock', () => {
  const original = physical().variants!
  const copied = editHelpers.duplicatePhysicalVariants(original, 'new-product')
  assert.notEqual(copied[0].id, original[0].id)
  assert.equal(copied[0].productId, 'new-product')
  assert.equal(copied[0].onHand, 0)
  assert.equal(copied[0].sku, null)
})

test('physical questions and options render actual forms without exposing a JSON editor', () => {
  const rules = renderToStaticMarkup(createElement(rulesField.CustomizationRulesField, { value: [{ key: 'teacher', label: 'Teacher name', type: 'text', required: true }], onChange: () => {} }))
  assert.match(rules, /Question shoppers see/)
  assert.match(rules, /value="Teacher name"/)
  assert.match(rules, /Required/)
  assert.doesNotMatch(rules, /JSON/)
  const variants = renderToStaticMarkup(createElement(variantsField.PhysicalVariantsField, { value: physical().variants, productId: 'gift-bag', onChange: () => {} }))
  assert.match(variants, />Stock</)
  assert.match(variants, /value="17"/)
  assert.match(variants, /Price \(ZAR\)/)
})

test('physical order summaries preserve quantities, personalisation, delivery and shipping', () => {
  const snapshot = makeSnapshot({ orders: [{ id: 'order', reference: 'DM-DEMO', customerId: 'customer', customerName: 'Demo', customerEmail: 'demo@example.test', status: 'paid', placedAt: '2026-11-10', totalZar: 310, paymentId: 'payment', hasPhysical: true, shippingZar: 75, shippingMethod: 'Sample delivery', fulfillmentStatus: 'unfulfilled', delivery: { recipientName: 'Demo', phone: '0821234567', addressLine1: '1 Example Road', suburb: 'Example', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', country: 'ZA' }, items: [{ id: 'item', productSlug: 'gift-bag', title: 'Large bag', productKind: 'Physical', priceZar: 235, quantity: 1, customizations: { teacher: 'Ms Demo' }, optionValues: { size: 'Large' } }] }] })
  const record = adapterModule.selectRecords(snapshot, 'orders')[0]
  assert.match(String(record.itemsSummary), /1 × Large bag/)
  assert.match(String(record.itemsSummary), /teacher: Ms Demo/)
  assert.match(String(record.itemsSummary), /size: Large/)
  assert.equal(record.fulfillmentStatus, 'unfulfilled')
  assert.equal(record.hasPhysical, true)
  assert.equal((record.delivery as Record<string, string>).city, 'Cape Town')
})

test('fulfilment UI permits only the next paid physical step, never payment-review dispatch', () => {
  const { nextFulfillmentStatus } = editHelpers
  assert.equal(nextFulfillmentStatus('unfulfilled'), 'shipped')
  assert.equal(nextFulfillmentStatus('shipped'), 'delivered')
  assert.equal(nextFulfillmentStatus('review'), null)
  const base = { id: 'order', hasPhysical: true, status: 'paid', fulfillmentStatus: 'unfulfilled', delivery: {} }
  const ready = renderToStaticMarkup(createElement(fulfillmentField.OrderFulfillment, { record: base }))
  assert.match(ready, /Mark as shipped/)
  const review = renderToStaticMarkup(createElement(fulfillmentField.OrderFulfillment, { record: { ...base, status: 'payment_review', fulfillmentStatus: 'review' } }))
  assert.match(review, /Do not dispatch/)
  assert.doesNotMatch(review, /Mark as shipped/)
  assert.equal(renderToStaticMarkup(createElement(fulfillmentField.OrderFulfillment, { record: { id: 'digital' } })), '')
})

test('the Products registry keeps digital fields conditional and exposes a physical type choice', () => {
  const config = collectionRegistry.find((collection) => collection.id === 'products')!
  const record = asRecord(physical())
  assert.equal(config.fields.find((field) => field.key === 'grade')?.visibleWhen?.(record), false)
  assert.equal(config.fields.find((field) => field.key === 'variants')?.visibleWhen?.(record), true)
  assert.ok(config.fields.some((field) => field.key === 'productType' && field.type === 'select'))
})

test('physical pricing controls are grouped under Pricing & visibility and stay hidden for digital products', () => {
  const config = collectionRegistry.find((collection) => collection.id === 'products')!
  const physicalRecord = asRecord(physical())
  const perLetter = { ...physicalRecord, pricingMode: 'per_character' }
  // The charged question and its letters are chosen on the question itself
  // ("Charge per letter"), so only the pricing method sits in this section.
  assert.deepEqual(config.sections.filter((section) => section.fields.includes('pricingMode')).map((section) => section.title), ['Pricing & visibility'])
  for (const key of ['pricingFieldKey', 'billableCharacters']) {
    assert.deepEqual(config.sections.filter((section) => section.fields.includes(key)), [])
  }
  for (const key of ['pricingMode', 'pricingFieldKey', 'billableCharacters']) {
    const field = config.fields.find((entry) => entry.key === key)!
    assert.equal(field.visibleWhen?.({ ...perLetter, productType: 'digital' }), false)
    assert.equal(field.visibleWhen?.(physicalRecord), key === 'pricingMode')
    assert.equal(field.visibleWhen?.(perLetter), true)
  }
})
