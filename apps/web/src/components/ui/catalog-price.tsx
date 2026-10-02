import { priceLabel, promotionPrice, type SalePricing } from '@designing-minds/cms'

export function CatalogPrice({ record }: { record: SalePricing }) {
  const price = promotionPrice(record)
  if (price === record.priceZar) return <>{priceLabel(price)}</>
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="sr-only">Original price </span>
      <s className="text-body-sm font-normal text-muted">{priceLabel(record.priceZar)}</s>
      <span><span className="sr-only">Sale price </span>{priceLabel(price)}</span>
    </span>
  )
}
