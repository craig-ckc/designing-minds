import { expect, it } from 'vitest'
import { physicalUnitPriceZar, physicalSelectionValidation, deliveryValidation, type PhysicalCatalogProduct } from '../../packages/cms/src/lib/commerce.ts'
import { toPublicSnapshot } from '../../packages/cms/src/lib/public-snapshot.ts'
import { withPricingTime } from '../../packages/cms/src/lib/promotions.ts'
import { makeSnapshot } from '../support/fixtures.ts'

const keyring: PhysicalCatalogProduct = {
  id: 'keyring', slug: 'keyring', title: 'Name keyring', shortDescription: '', fullDescription: '', productType: 'physical', priceZar: 30,
  pricingMode: 'per_character', pricingFieldKey: 'name', billableCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  customizationRules: [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { allowedCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', maxLength: 12 } }],
  galleryImages: [], variants: [{ id: 'pink', sku: null, optionValues: { colour: 'pink' }, unitPriceZar: null, available: true }], published: true,
}

it('prices configured letter units and validates inputs without treating variant options as free-form customisation', () => {
  expect(physicalSelectionValidation(keyring, 'pink', 2, { name: 'Ava' })).toBeNull()
  expect(physicalUnitPriceZar(keyring, keyring.variants[0]!, { name: 'Ava' })).toBe(90)
  expect(physicalSelectionValidation(keyring, 'pink', 1.5, { name: 'Ava' })).toMatch(/whole/)
  expect(physicalSelectionValidation(keyring, 'pink', 1, { name: '' })).toMatch(/required/)
  expect(physicalSelectionValidation(keyring, 'pink', 1, { name: 'Ava', colour: 'pink' })).toMatch(/Unexpected/)
})

it('uses scheduled sale rates and variant overrides consistently with the catalogue clock', () => {
  const snapshot = withPricingTime(makeSnapshot({ physicalCatalog: [{ ...keyring, salePriceZar: 20, saleStartsAt: '2026-11-10T10:00:00Z', saleEndsAt: '2026-11-10T11:00:00Z' }] }), Date.parse('2026-11-10T10:30:00Z'))
  const product = snapshot.physicalCatalog![0]!
  expect(physicalUnitPriceZar(product, product.variants[0]!, { name: 'Ava' })).toBe(60)
  expect(physicalUnitPriceZar(product, { ...product.variants[0]!, unitPriceZar: 35 }, { name: 'Ava' })).toBe(105)
  expect(keyring).not.toHaveProperty('priceAsOf')
})

it('allowlists public physical listings without serializing inventory, working drafts or private settings', () => {
  const snapshot = makeSnapshot({ physicalCatalog: [{ ...keyring, onHand: 50, variants: [{ ...keyring.variants[0]!, onHand: 50, live: { internal: true } }] } as unknown as PhysicalCatalogProduct], localCommercePreview: true, commerceReady: true })
  const published = toPublicSnapshot(snapshot)
  expect(published.physicalCatalog?.[0]).not.toHaveProperty('onHand')
  expect(published.physicalCatalog?.[0].variants[0]).not.toHaveProperty('onHand')
  expect(published.physicalCatalog?.[0].variants[0]).not.toHaveProperty('live')
  expect(published.localCommercePreview).toBe(true)
})

it('validates South African delivery fields only when a physical shipment needs them', () => {
  const delivery = { recipientName: 'Maya', phone: '082 123 4567', addressLine1: '1 Sample Road', suburb: 'Gardens', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', country: 'ZA' as const }
  expect(deliveryValidation(delivery)).toBeNull()
  expect(deliveryValidation(null)).toMatch(/delivery/)
  expect(deliveryValidation({ ...delivery, phone: '123' })).toMatch(/contact/)
  expect(deliveryValidation({ ...delivery, postalCode: '80' })).toMatch(/postal/)
})
