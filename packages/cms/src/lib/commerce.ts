import type { OrderItem, ProductImage } from '../types'
import type { CustomizationRule } from './physical-products'
import { validateCustomizationValues } from './physical-products.ts'
import { promotionPrice } from './promotions.ts'

export type PhysicalPricingMode = 'fixed' | 'per_character'
export type FulfillmentStatus = 'not_required' | 'unfulfilled' | 'shipped' | 'delivered' | 'review'

export interface PhysicalVariantDraft {
  /** Editor-only marker; never used for authorization or persisted as content. */
  _persisted?: boolean
  id: string
  productId: string
  sku: string | null
  optionValues: Record<string, string>
  unitPriceZar: number | null
  active: boolean
  sortOrder: number
  onHand: number
  /** Present only when an operator intentionally changes an existing stock count. */
  stockAdjustment?: { expectedOnHand: number; newOnHand: number }
  weightGrams?: number | null
  lengthMm?: number | null
  widthMm?: number | null
  heightMm?: number | null
}

/** Curated public variant: exact inventory counts remain private. */
export interface PhysicalCatalogVariant {
  id: string
  sku: string | null
  optionValues: Record<string, string>
  unitPriceZar: number | null
  available: boolean
}

export interface PhysicalCatalogProduct {
  id: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  productType: 'physical'
  priceZar: number
  /** Shared display clock for prerender/hydration and scheduled sale boundaries. */
  priceAsOf?: number
  salePriceZar?: number | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
  pricingMode: PhysicalPricingMode
  pricingFieldKey: string | null
  billableCharacters: string | null
  customizationRules: CustomizationRule[]
  galleryImages: ProductImage[]
  variants: PhysicalCatalogVariant[]
  published: true
}

export interface PhysicalCartLine {
  id: string
  productSlug: string
  variantId: string
  quantity: number
  customizations: Record<string, string>
}

export interface DeliveryDetails {
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: 'ZA'
}

export interface ShippingOption {
  id: string
  label: string
  amountZar: number
}

export interface CommerceOrderItem extends OrderItem {
  productType: 'digital' | 'physical'
  quantity: number
  unitPriceZar: number
  /** priceZar is the whole line's value, before an order-level discount. */
  customizations?: Record<string, string>
  variantId?: string
  optionValues?: Record<string, string>
  cartLineId?: string
}

/** Customer id and all prices are supplied by the authenticated server. */
export interface CommerceInput {
  digitalSlugs: string[]
  physicalItems: PhysicalCartLine[]
  couponCode?: string
  delivery?: DeliveryDetails | null
  shippingOptionId?: string | null
}

export interface CommerceCheckoutInput extends CommerceInput {
  acceptedTerms: boolean
  expectedTotalZar: number
}

export interface CommerceQuote {
  items: CommerceOrderItem[]
  subtotalZar: number
  discountZar: number
  shippingZar: number
  totalZar: number
  couponCode: string | null
  hasPhysical: boolean
  shippingOption: ShippingOption | null
  localPreview: boolean
}

export interface CommerceCheckoutResponse extends CommerceQuote {
  orderId: string
  paymentId: string
  reference: string
  reservationExpiresAt: string | null
  simulation?: boolean
  payfast?: { url: string; fields: Record<string, string | number | boolean> }
}

export const physicalLineKey = (line: Pick<PhysicalCartLine, 'productSlug' | 'variantId' | 'customizations'>): string =>
  JSON.stringify([line.productSlug, line.variantId, Object.entries(line.customizations).sort(([a], [b]) => a.localeCompare(b))])

export const quantityValidation = (value: unknown): string | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2_147_483_647
    ? null : 'Quantity must be a positive whole number.'

export function physicalSelectionValidation(product: PhysicalCatalogProduct, variantId: string, quantity: number, values: Record<string, string>): string | null {
  const pricingError = physicalPricingValidation(product)
  if (pricingError) return pricingError
  const quantityError = quantityValidation(quantity)
  if (quantityError) return quantityError
  const variant = product.variants.find((entry) => entry.id === variantId)
  if (!variant || !variant.available) return 'This option is out of stock. Please choose another option.'
  if (product.customizationRules.length > 0) {
    const error = validateCustomizationValues(product.customizationRules, values)
    if (error) return error
  } else if (Object.keys(values).length > 0) return 'This product does not accept personalisation.'
  if (product.pricingMode === 'per_character') {
    if (!product.pricingFieldKey || !product.billableCharacters) return 'Name pricing is not configured for this product.'
    const value = values[product.pricingFieldKey]
    const billable = new Set(Array.from(product.billableCharacters))
    if (typeof value !== 'string' || !Array.from(value).some((character) => billable.has(character))) return 'Enter a name containing a billable letter.'
  }
  return null
}

export function physicalPricingValidation(product: Pick<PhysicalCatalogProduct, 'pricingMode' | 'pricingFieldKey' | 'billableCharacters' | 'customizationRules'>): string | null {
  if (product.pricingMode === 'fixed') {
    return product.pricingFieldKey == null && product.billableCharacters == null ? null : 'Fixed pricing cannot include name-pricing settings.'
  }
  if (product.pricingMode !== 'per_character') return 'Choose a supported pricing method.'
  const rule = product.customizationRules.find((entry) => entry.key === product.pricingFieldKey)
  if (!rule || rule.type !== 'text' || !rule.required || !product.billableCharacters) return 'Name pricing requires a required text field and configured billable characters.'
  return null
}

/** Display estimate only; checkout always recalculates in the database. */
export function physicalUnitPriceZar(product: PhysicalCatalogProduct, variant: PhysicalCatalogVariant, values: Record<string, string>): number {
  const base = variant.unitPriceZar == null ? promotionPrice(product) : variant.unitPriceZar
  if (product.pricingMode === 'fixed') return base
  if (!product.pricingFieldKey || !product.billableCharacters) return 0
  const billable = new Set(Array.from(product.billableCharacters))
  const letters = Array.from(values[product.pricingFieldKey] ?? '').filter((character) => billable.has(character)).length
  return Math.round(base * 100) * letters / 100
}

export const normalizeDeliveryPhone = (value: string): string => value.replace(/[\s()-]/g, '')

export function deliveryValidation(value: DeliveryDetails | null | undefined): string | null {
  if (!value) return 'Enter your delivery details.'
  for (const key of ['recipientName', 'addressLine1', 'suburb', 'city', 'province'] as const) {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > 200) return 'Complete the recipient name and delivery address.'
  }
  if (typeof value.phone !== 'string' || !/^(?:0\d{9}|\+27\d{9})$/.test(normalizeDeliveryPhone(value.phone))) return 'Enter a South African contact number, such as 0821234567.'
  if (typeof value.postalCode !== 'string' || !/^\d{4}$/.test(value.postalCode)) return 'Enter a four-digit postal code.'
  if (value.country !== 'ZA') return 'Delivery is currently available in South Africa only.'
  if (value.addressLine2 !== undefined && (typeof value.addressLine2 !== 'string' || value.addressLine2.length > 200)) return 'Address line 2 must be at most 200 characters.'
  return null
}
