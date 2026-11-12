import type { CmsSnapshot } from '@designing-minds/cms'
import { commerceFieldLabel } from '../lib/commerce-label'
import { priceLabel } from '@designing-minds/cms'
import { CartLine } from './ui/cart-line'
import { ProductCover } from './ui/product-cover'

/** "Colour: Pink · Name: Thandi" from the recorded option and personalisation values. */
function optionsLine(
  values: Record<string, string>,
  product?: Parameters<typeof commerceFieldLabel>[1],
): string {
  return Object.entries(values).map(([key, value]) => `${commerceFieldLabel(key, product)}: ${value}`).join(' · ')
}

/**
 * Read-only CartLine for checkout and order receipts. Media is looked up from
 * the live snapshot by slug (first gallery photo for physical lines, the live
 * cover for digital ones) and falls back to the empty frame.
 */
export function SummaryLine({
  snapshot,
  slug,
  title,
  physical,
  quantity = 1,
  unitPriceZar,
  values = {},
  price,
  originalPriceZar,
}: {
  snapshot: Pick<CmsSnapshot, 'products' | 'bundles' | 'physicalCatalog'>
  slug: string
  title: string
  physical: boolean
  quantity?: number
  unitPriceZar?: number
  /** Option and personalisation values, already merged. */
  values?: Record<string, string>
  price: number
  originalPriceZar?: number
}) {
  const catalogProduct = physical ? snapshot.physicalCatalog?.find((entry) => entry.slug === slug) : undefined
  let cover = null
  let meta: string | undefined
  if (!physical) {
    const product = snapshot.products?.find((entry) => entry.slug === slug)
    const bundle = product ? undefined : snapshot.bundles?.find((entry) => entry.slug === slug)
    const record = product ?? bundle
    if (record) {
      const subjects = product
        ? product.subjects
        : [...new Set((snapshot.products ?? []).filter((entry) => bundle?.includedProductSlugs.includes(entry.slug)).flatMap((entry) => entry.subjects))]
      cover = <ProductCover product={{ title: record.title, grade: record.grade, term: record.term, subjects }} stacked={Boolean(bundle)} />
      meta = bundle ? `Bundle · ${record.grade} · ${record.term}` : `${record.grade} · ${record.term}`
    } else meta = 'Digital resource'
  } else meta = `Quantity ${quantity}${unitPriceZar != null ? ` × ${priceLabel(unitPriceZar)}` : ''}`
  const image = catalogProduct?.galleryImages[0]
  return (
    <CartLine
      type={physical ? 'physical' : 'digital'}
      context="summary"
      title={title}
      meta={meta}
      options={physical ? optionsLine(values, catalogProduct) || undefined : undefined}
      image={image}
      cover={cover}
      price={<>
        {originalPriceZar !== undefined && originalPriceZar > price ? <s className="mr-2 text-muted">{priceLabel(originalPriceZar)}</s> : null}
        {priceLabel(price)}
      </>}
    />
  )
}
