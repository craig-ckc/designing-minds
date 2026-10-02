import type { CmsSnapshot } from '../types.ts'

/** Sale schedules use [start, end). The regular price remains the source value. */
export interface SalePricing {
  priceZar: number
  /** Render-only clock: initial hydration matches the static page build. */
  priceAsOf?: number
  salePriceZar?: number | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
}
export function promotionPrice(record: SalePricing, now = record.priceAsOf ?? Date.now()): number {
  const sale = record.salePriceZar
  if (sale == null || !Number.isFinite(sale) || sale <= 0 || sale >= record.priceZar) return record.priceZar
  if (record.saleStartsAt && !(Date.parse(record.saleStartsAt) <= now)) return record.priceZar
  if (record.saleEndsAt && !(now < Date.parse(record.saleEndsAt))) return record.priceZar
  return sale
}
const validMoney = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 99999999.99 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001
export function promotionValidation(collection: string, record: Record<string, unknown>): string | null {
  if (collection === 'products' || collection === 'bundles') {
    if (record.salePriceZar != null && (!validMoney(record.salePriceZar) || Number(record.salePriceZar) >= Number(record.priceZar))) return 'Sale price must be positive, have at most two decimal places, and be lower than the regular price.'
    return validateDates(record.saleStartsAt, record.saleEndsAt)
  }
  if (collection === 'coupons') {
    if (!/^[A-Z0-9_-]{1,40}$/.test(String(record.code ?? '').trim().toUpperCase())) return 'Use 1–40 letters, numbers, underscores or hyphens for the code.'
    if (!['percentage','fixed'].includes(String(record.discountType))) return 'Choose a percentage or fixed discount.'
    if (!validMoney(record.value) || (record.discountType === 'percentage' && Number(record.value) > 100)) return 'Enter a positive discount with at most two decimal places; percentages cannot exceed 100.'
    return validateDates(record.startsAt, record.expiresAt)
  }
  return null
}
function validateDates(start: unknown, end: unknown): string | null {
  const from = start ? Date.parse(String(start)) : null
  const until = end ? Date.parse(String(end)) : null
  if ((from !== null && !Number.isFinite(from)) || (until !== null && !Number.isFinite(until))) return 'Enter valid promotion dates.'
  if (from !== null && until !== null && from >= until) return 'The end must be later than the start.'
  return null
}
/** South Africa uses UTC+2 year-round. Admin schedule fields are explicit SAST. */
export function toJohannesburgInput(value?: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  return new Date(Date.parse(value) + 2 * 3600000).toISOString().slice(0,16)
}
export function fromJohannesburgInput(value: string): string | null {
  return value ? new Date(`${value}:00+02:00`).toISOString() : null
}

/** Pin SSR and initial hydration to the same clock; advance after hydration. */
export function withPricingTime(snapshot: CmsSnapshot, now: number): CmsSnapshot {
  return { ...snapshot,
    products: snapshot.products.map((record) => ({ ...record, priceAsOf: now })),
    bundles: snapshot.bundles.map((record) => ({ ...record, priceAsOf: now })),
  }
}
export const duplicateCouponCode = (code: string, id: string) => `${code.trim().toUpperCase().slice(0,31)}_${id.slice(0,8).toUpperCase()}`
