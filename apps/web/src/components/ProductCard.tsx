import { Link } from 'react-router-dom'
import { type CmsProduct } from '@designing-minds/cms'
import { Placeholder } from './ui/Placeholder'
import { Chip } from './ui/Chip'
import { Button } from './ui/Button'

export function ProductCard({ product }: { product: CmsProduct }) {
  return (
    <article className="flex flex-col overflow-hidden border border-line bg-surface transition hover:border-ink">
      <Link to={`/product/${product.slug}`} className="block">
        <Placeholder ratio="4 / 3" className="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <div className="flex flex-wrap gap-2">
          <Chip>{product.grade}</Chip>
          <Chip>{product.term}</Chip>
        </div>
        <Link to={`/product/${product.slug}`} className="hover:opacity-70">
          <h4 className="line-clamp-2 text-[1.02rem] leading-snug">{product.title}</h4>
        </Link>
        <p className="line-clamp-2 flex-1 text-[0.88rem] text-muted">{product.excerpt || product.primarySubject}</p>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-semibold">{product.priceLabel}</span>
          <div className="flex items-center gap-4">
            <Button to={`/product/${product.slug}`} variant="text" className="text-[0.9rem]">
              View
            </Button>
            <Button type="button" variant="text" className="text-[0.9rem]">
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
