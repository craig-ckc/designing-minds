import { promotionPrice, type SalePricing } from '@designing-minds/cms'

export const CATALOG_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'title', label: 'Name: A–Z' },
] as const
export type CatalogSort = typeof CATALOG_SORT_OPTIONS[number]['value']
export const readCatalogSort = (value: string | null): CatalogSort =>
  CATALOG_SORT_OPTIONS.find((option) => option.value === value)?.value ?? 'recommended'

type SortRecord = SalePricing & { title: string; updatedAt?: string }
const timestamp = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0

/** Sort a copy; recommended preserves the catalogue's curated, bundles-first order. */
export function sortCatalogItems<T>(items: readonly T[], sort: CatalogSort, record: (item: T) => SortRecord): T[] {
  const result = [...items]
  if (sort === 'recommended') return result
  return result.sort((a, b) => {
    const left = record(a)
    const right = record(b)
    switch (sort) {
      case 'price-asc': return promotionPrice(left) - promotionPrice(right)
      case 'price-desc': return promotionPrice(right) - promotionPrice(left)
      case 'newest': return timestamp(right.updatedAt) - timestamp(left.updatedAt)
      case 'title': return left.title.localeCompare(right.title, 'en', { numeric: true, sensitivity: 'base' })
    }
  })
}
