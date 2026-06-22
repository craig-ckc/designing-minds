import { Link } from 'react-router-dom'
import { type Product, priceLabel } from '@designing-minds/cms'
import { Placeholder } from './ui/Placeholder'
import { Chip } from './ui/Chip'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

const KIND_TONE = {
  Bundle: 'solid',
  'Access Plan': 'outline',
  'Individual Resource': 'neutral',
} as const

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col overflow-hidden border border-line bg-surface transition hover:border-ink">
      <Link to={`/product/${product.slug}`} className="block">
        <Placeholder ratio="4 / 3" label={product.resourceFormat} className="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={KIND_TONE[product.productKind]}>{product.productKind}</Badge>
          <Chip>{product.grade}</Chip>
          <Chip>{product.term}</Chip>
        </div>
        <Link to={`/product/${product.slug}`} className="hover:opacity-70">
          <h4 className="line-clamp-2 text-[1.02rem] leading-snug">{product.title}</h4>
        </Link>
        <p className="line-clamp-2 flex-1 text-[0.88rem] text-muted">{product.shortDescription}</p>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-semibold">{priceLabel(product.priceZar)}</span>
          <div className="flex items-center gap-4">
            <Button to={`/product/${product.slug}`} variant="text" size="sm">
              View
            </Button>
            <Button type="button" variant="text" size="sm">
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
