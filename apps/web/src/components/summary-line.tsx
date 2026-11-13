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
 *
 * Meta reads "Grade 4 · Term 1" for a single resource ("Single · Grade 4 ·
 * Term 1" with `showKind`), "Bundle · Grade 4 · Term 3 · 4 resources" for a
 * bundle and "Qty 2" (or "Qty 2 × R 89" with `unitPriceZar`) for a physical line.
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
  showKind = false,
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
  /** Prefix single resources with "Single" as well as bundles with "Bundle" (receipts list both kinds). */
  showKind?: boolean
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
      cover = <ProductCover product={{ id: record.id, title: record.title, grade: record.grade, term: record.term, subjects }} stacked={Boolean(bundle)} />
      // Count published members only, like the cart's bundle line (bundleContents).
      const resourceCount = bundle ? (snapshot.products ?? []).filter((entry) => entry.published && bundle.includedProductSlugs.includes(entry.slug)).length : 0
      const kind = bundle ? 'Bundle · ' : showKind ? 'Single · ' : ''
      const count = resourceCount > 0 ? ` · ${resourceCount} resource${resourceCount === 1 ? '' : 's'}` : ''
      meta = `${kind}${record.grade} · ${record.term}${count}`
    } else meta = 'Digital resource'
  } else meta = `Qty ${quantity}${unitPriceZar != null ? ` × ${priceLabel(unitPriceZar)}` : ''}`
  const struck = originalPriceZar !== undefined && originalPriceZar > price
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
        {struck ? <span className="text-caption font-normal text-muted"><span className="sr-only">Original price </span><s>{priceLabel(originalPriceZar)}</s></span> : null}
        <span>{struck ? <span className="sr-only">Sale price </span> : null}{priceLabel(price)}</span>
      </>}
    />
  )
}
