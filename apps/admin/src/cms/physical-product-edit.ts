import { customizationRulesValidation, physicalPricingValidation, type PhysicalProduct, type PhysicalVariantDraft, type ValueLists } from '@designing-minds/cms'
import type { AdminRecord } from './types'

export const isPhysicalRecord = (record: AdminRecord) => record.productType === 'physical'

/** Product type can be selected before the first save, never rewritten on an existing SKU. */
export function chooseNewProductType(record: AdminRecord, value: unknown, lists: ValueLists, year: string): AdminRecord {
  if (value === 'physical') return {
    ...record, productType: 'physical', grade: null, term: null, year: null, resourceFormat: null,
    subjects: [], marks: null, purchasedFiles: [], previewPdfs: [],
    weightGrams: null, lengthMm: null, widthMm: null, heightMm: null,
    customizationRules: [], pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null, variants: [],
  }
  return {
    ...record, productType: 'digital', grade: lists.grades[0], term: lists.terms[0], year,
    resourceFormat: lists.resourceFormats[0], subjects: [], marks: null,
    weightGrams: null, lengthMm: null, widthMm: null, heightMm: null,
    customizationRules: [], pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
    variants: undefined,
  }
}

export function physicalProductEditValidation(record: AdminRecord): string | null {
  if (!isPhysicalRecord(record)) return null
  const product = record as unknown as PhysicalProduct
  const configuration = customizationRulesValidation(product.customizationRules)
  if (configuration) return configuration
  const pricing = physicalPricingValidation(product)
  if (pricing) return pricing
  for (const key of ['weightGrams', 'lengthMm', 'widthMm', 'heightMm'] as const) {
    const value = product[key]
    if (value !== null && value !== undefined && (!Number.isInteger(value) || value <= 0 || value > 2_147_483_647)) return 'Measurements must be positive whole numbers, or left blank.'
  }
  if (!Array.isArray(product.variants)) return 'Add a product option before saving.'
  if (product.status === 'queued' && !product.variants.some((variant) => variant.active)) return 'Add at least one available product option before queueing this product.'
  const seenIds = new Set<string>()
  const seenSkus = new Set<string>()
  for (const variant of product.variants) {
    if (!variant.id || seenIds.has(variant.id) || variant.productId !== product.id) return 'Each option must belong to this product and have its own identity.'
    seenIds.add(variant.id)
    if (variant.sku && seenSkus.has(variant.sku)) return 'Each SKU must be unique within this product.'
    if (variant.sku) seenSkus.add(variant.sku)
    if (variant.unitPriceZar !== null && (!Number.isFinite(variant.unitPriceZar) || variant.unitPriceZar <= 0)) return 'Price overrides must be greater than zero, or left blank.'
    if (product.status === 'queued' && variant.active && (!Number.isFinite(variant.unitPriceZar ?? product.priceZar) || (variant.unitPriceZar ?? product.priceZar) <= 0)) return 'Set a price greater than zero for each available option before queueing this product.'
    const stock = variant.stockAdjustment?.newOnHand ?? variant.onHand
    if (!Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647) return 'Stock must be a non-negative whole number.'
    if (variant.stockAdjustment && (!Number.isInteger(variant.stockAdjustment.expectedOnHand) || variant.stockAdjustment.expectedOnHand < 0)) return 'Refresh the product before changing its stock.'
    if (Object.entries(variant.optionValues).some(([key, value]) => !key.trim() || !value.trim())) return 'Complete each option name and value, or remove the empty choice.'
  }
  return null
}

export function duplicatePhysicalVariants(variants: PhysicalVariantDraft[] | undefined, productId: string): PhysicalVariantDraft[] {
  return (variants ?? []).map((variant) => ({
    ...variant, id: crypto.randomUUID(), productId, sku: null, onHand: 0,
    stockAdjustment: undefined, _persisted: false,
  }))
}

export const nextFulfillmentStatus = (status: unknown): 'shipped' | 'delivered' | null =>
  status === 'unfulfilled' ? 'shipped' : status === 'shipped' ? 'delivered' : null
