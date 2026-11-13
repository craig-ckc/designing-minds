import { physicalConfigurationValidation, physicalPricingValidation, sameOptionValues, variantCombinations, variantConforms, type PhysicalProduct, type PhysicalVariantDraft, type ValueLists, type VariantOptionDefinition } from '@designing-minds/cms'
import type { AdminRecord } from './types'

export const isPhysicalRecord = (record: AdminRecord) => record.productType === 'physical'

/** A starting swatch for common colour names; the owner can change it. */
const NAMED_SWATCHES: Record<string, string> = {
  pink: '#ec4f9c', 'hot pink': '#e91e8c', red: '#d94a4a', orange: '#ef8f3c', yellow: '#f3d46b', green: '#5fae6e',
  mint: '#9fd8c3', teal: '#2a9d8f', turquoise: '#40c4c0', blue: '#2f74d0', 'light blue': '#7fb7ec', navy: '#253b61',
  purple: '#8a4fd0', lilac: '#c8b4e5', brown: '#8b5e3c', black: '#262626', white: '#ffffff', grey: '#9e9e9e', gray: '#9e9e9e',
  gold: '#d4af37', silver: '#c0c0c0',
}
export const guessSwatch = (name: string): string | undefined => NAMED_SWATCHES[name.trim().toLowerCase()]

/** "Letters only" for a text question. */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
/** Per-letter billing ignores case, so capitals cover every letter. */
export const BILLABLE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** A stable machine key from a shopper-facing name: "Teacher’s name" -> "teachers_name". */
export function uniqueKey(label: string, taken: readonly string[], fallback: string): string {
  const base = label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || fallback
  let key = base
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`
  return key
}

/** Product type can be selected before the first save, never rewritten on an existing SKU. */
export function chooseNewProductType(record: AdminRecord, value: unknown, lists: ValueLists, year: string): AdminRecord {
  if (value === 'physical') return {
    ...record, productType: 'physical', grade: null, term: null, year: null, resourceFormat: null,
    subjects: [], marks: null, purchasedFiles: [], previewPdfs: [],
    weightGrams: null, lengthMm: null, widthMm: null, heightMm: null,
    customizationRules: [], pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null, variants: [],
    variantOptions: [], leadTimeDays: null, previewTemplate: null,
  }
  return {
    ...record, productType: 'digital', grade: lists.grades[0], term: lists.terms[0], year,
    resourceFormat: lists.resourceFormats[0], subjects: [], marks: null,
    weightGrams: null, lengthMm: null, widthMm: null, heightMm: null,
    customizationRules: [], pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
    variants: undefined, variantOptions: [], leadTimeDays: null, previewTemplate: null,
  }
}

export function physicalProductEditValidation(record: AdminRecord): string | null {
  if (!isPhysicalRecord(record)) return null
  const product = record as unknown as PhysicalProduct
  const options = product.variantOptions ?? []
  const configuration = physicalConfigurationValidation(options, product.customizationRules, product.pricingFieldKey)
  if (configuration) return configuration
  if (product.leadTimeDays != null && (!Number.isInteger(product.leadTimeDays) || product.leadTimeDays < 1 || product.leadTimeDays > 365)) return 'Made-to-order time must be between 1 and 365 working days, or left empty.'
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
    if (variant.active && !variantConforms(options, variant.optionValues ?? {})) {
      return options.length ? 'Choose a value for every product option on each available variant.' : 'Add product options above before giving a variant choices, or turn that variant off.'
    }
  }
  const active = product.variants.filter((variant) => variant.active)
  if (active.some((variant, index) => active.slice(index + 1).some((other) => sameOptionValues(variant.optionValues ?? {}, other.optionValues ?? {})))) {
    return options.length ? 'Two available variants have the same choices. Turn one off or change its values.' : 'A product without options sells as one variant. Turn the extra variants off, or add product options.'
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

const newVariant = (productId: string, sortOrder: number, optionValues: Record<string, string>): PhysicalVariantDraft => ({
  id: crypto.randomUUID(),
  productId,
  sku: null,
  optionValues,
  unitPriceZar: null,
  active: true,
  sortOrder,
  inventoryPolicy: 'tracked',
  onHand: 0,
})

export const usableOptions = (options: VariantOptionDefinition[]) => options
  .map((option) => ({ ...option, values: option.values.filter((entry) => entry.value.trim()) }))
  .filter((option) => option.key && option.values.length > 0)

/** The option values the server holds for a saved variant (null for unsaved ones). */
export const savedOptionValues = (variant: PhysicalVariantDraft): Record<string, string> | null =>
  variant._persisted ? variant._savedOptionValues ?? variant.optionValues ?? {} : null

const isSubsetOf = (part: Record<string, string>, whole: Record<string, string>) =>
  Object.entries(part).every(([key, value]) => whole[key] === value)

/**
 * Keep variants in step with the options: add every new combination, drop
 * unsaved variants whose combination no longer exists. Saved variants are
 * never removed (stock and orders refer to them); they are flagged instead.
 */
export function syncVariants(variants: PhysicalVariantDraft[], options: VariantOptionDefinition[], productId: string): PhysicalVariantDraft[] {
  const declared = usableOptions(options)
  const combinations = declared.length ? variantCombinations(declared) : [{}]
  const declaredKeys = new Set(declared.map((option) => option.key))
  // Like Shopify: a saved variant takes a new option's first value, so its
  // stock and history carry over. Only what the server holds is fixed; a value
  // given in this draft goes away again if the option is removed.
  const adopted = variants.map((variant) => {
    const saved = savedOptionValues(variant)
    if (!saved) return variant
    const values: Record<string, string> = {}
    for (const option of declared) {
      const current = variant.optionValues?.[option.key]
      values[option.key] = current !== undefined && option.values.some((entry) => entry.value === current)
        ? current
        : saved[option.key] ?? option.values[0].value
    }
    for (const [key, value] of Object.entries(saved)) if (!declaredKeys.has(key)) values[key] = value
    return sameOptionValues(values, variant.optionValues ?? {}) ? variant : { ...variant, optionValues: values }
  })
  // Saved variants always stay. An unsaved one stays only for a declared
  // combination that no earlier variant already covers.
  const kept = adopted.filter((variant, index) => variant._persisted || (
    combinations.some((combination) => sameOptionValues(variant.optionValues ?? {}, combination))
    && !adopted.slice(0, index).some((earlier) => sameOptionValues(earlier.optionValues ?? {}, variant.optionValues ?? {}))
  ))
  const missing = combinations.filter((combination) => !kept.some((variant) => sameOptionValues(variant.optionValues ?? {}, combination)))
  // A new combination copies price and made-to-order from the variant it grew
  // from (Large → Large · Blue keeps R235 and made to order).
  return [...kept, ...missing.map((combination, index) => {
    const origin = variants.find((variant) => variant._persisted && isSubsetOf(savedOptionValues(variant) ?? {}, combination))
      ?? variants.find((variant) => isSubsetOf(variant.optionValues ?? {}, combination))
    const created = newVariant(productId, kept.length + index + 1, combination)
    return origin ? { ...created, unitPriceZar: origin.unitPriceZar, inventoryPolicy: origin.inventoryPolicy ?? 'tracked' } : created
  })]
}
