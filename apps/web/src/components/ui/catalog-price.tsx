import { priceLabel, promotionPrice, type SalePricing } from '@designing-minds/cms'

export function CatalogPrice({ record, compareAtPriceZar }: { record: SalePricing; compareAtPriceZar?: number }) {
  const price = promotionPrice(record)
  const onSale = price < record.priceZar
  // A scheduled sale compares against the record's own regular price. Otherwise
  // bundles may compare against the cost of buying their members individually.
  const originalPrice = !onSale && typeof compareAtPriceZar === 'number' && Number.isFinite(compareAtPriceZar) && compareAtPriceZar > price
    ? compareAtPriceZar
    : record.priceZar
  if (originalPrice <= price) return <>{priceLabel(price)}</>
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="sr-only">{onSale ? 'Original price ' : 'Price bought individually '}</span>
      <s className="font-normal text-muted">{priceLabel(originalPrice)}</s>
      <span><span className="sr-only">{onSale ? 'Sale price ' : 'Bundle price '}</span>{priceLabel(price)}</span>
    </span>
  )
}
