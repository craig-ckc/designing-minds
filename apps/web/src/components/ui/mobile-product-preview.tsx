import { ProductCover, type CoverItem } from './product-cover'

/** A compact product reference beside the phone offer, linked to its full preview. */
export function MobileProductPreview({ item, stacked = false }: { item: CoverItem; stacked?: boolean }) {
  return (
    <a href="#product-preview" aria-label={`Preview ${item.title}`} className="float-right mb-2 ml-4 block w-20 rounded-md lg:hidden">
      <span aria-hidden="true" className="block">
        <ProductCover product={item} stacked={stacked} />
      </span>
    </a>
  )
}
