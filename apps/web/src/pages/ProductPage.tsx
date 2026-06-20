import { Link, useParams } from 'react-router-dom'
import { formatCurrency, getProductBySlug, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { BodyCopy } from '../components/ui/BodyCopy'
import { Button } from '../components/ui/Button'
import { ProductCard } from '../components/ProductCard'
import { SpecRow } from '../components/SpecRow'
import { NotFoundPage } from './NotFoundPage'

export function ProductPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const product = slug ? getProductBySlug(snapshot, slug) : undefined

  if (!product) {
    return <NotFoundPage />
  }

  const related = snapshot.products
    .filter((entry) => entry.id !== product.id && entry.grade === product.grade)
    .slice(0, 3)

  return (
    <>
      <section className="section">
        <Container>
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
            ]}
            current={product.grade}
          />

          <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <Placeholder label="Sample preview" ratio="4 / 3.2" />
              <div className="mt-8 text-ink-soft">
                <h3 className="mb-4">About this resource</h3>
                {product.excerpt ? <p className="text-[1.02rem]">{product.excerpt}</p> : null}
                <BodyCopy body={product.body} divided />
              </div>
            </div>

            <aside className="grid gap-[18px] rounded-[10px] border border-line p-7 lg:sticky lg:top-24">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">
                {product.grade} · {product.term}
              </p>
              <h1 className="text-[1.7rem]">{product.title}</h1>
              <div className="text-[2.4rem] font-semibold tracking-[-0.03em]">{formatCurrency(product.priceZar)}</div>
              <ul className="grid gap-3">
                <SpecRow label="Grade" value={product.grade} />
                <SpecRow label="Term" value={product.term} />
                <SpecRow label="Subject" value={product.primarySubject} />
                <SpecRow label="Format" value={product.type} />
                <SpecRow label="Marks" value={product.marks ? `${product.marks} marks` : 'Not listed'} />
                <SpecRow label="Delivery" value="Instant PDF download" last />
              </ul>
              <Button type="button" variant="solid" className="w-full">
                <span className="h-4 w-4">
                  <Icon name="cart" />
                </span>
                Add to cart
              </Button>
              <p className="text-[0.82rem] text-muted">CAPS-aligned · Memo included · Print at home</p>
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="section bg-surface-alt">
          <Container>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h3>More {product.grade} resources</h3>
              <Link
                to={`/shop?grade=${encodeURIComponent(product.grade)}`}
                className="inline-flex items-center gap-1.5 border-b-[1.5px] border-current pb-0.5 font-medium hover:opacity-70"
              >
                See all
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <ProductCard key={entry.id} product={entry} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
