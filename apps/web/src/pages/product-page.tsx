import { Link, useParams } from 'react-router-dom'
import {
  getFaqsByIds,
  getProductBySlug,
  getProductsBySlugs,
  priceLabel,
  relatedProducts,
  type CmsSnapshot,
} from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Icon } from '../components/ui/icon'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { FaqAccordion } from '../components/ui/faq-accordion'
import { IncludedProduct } from '../components/ui/included-product'
import { ProductCard } from '../components/ui/product-card'
import { ProductCover } from '../components/ui/product-cover'
import { SpecRow } from '../components/ui/spec-row'
import { addCartSlug } from '../lib/cart'
import { Markdown } from '../lib/markdown'
import { NotFoundPage } from './not-found-page'

export function ProductPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const product = slug ? getProductBySlug(snapshot, slug) : undefined

  if (!product?.published) {
    return <NotFoundPage />
  }

  const faqs = getFaqsByIds(snapshot, product.faqs)
  const included = getProductsBySlugs(snapshot, product.includedProductSlugs ?? [])
  const related = relatedProducts(snapshot, product, 4)
  const isComposite = product.productKind === 'Bundle' || product.productKind === 'Access Plan'

  return (
    <>
      <section className="section">
        <Container>
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
            ]}
            current={product.title}
          />
          <h1 className="sr-only">{product.title}</h1>

          <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <div className="flex justify-center px-8 py-4 sm:px-12">
                <ProductCover product={product} className="max-w-[22rem]" />
              </div>

              {/* Description — CMS rich text stored as Markdown */}
              <div className="mt-8 text-ink-soft">
                <h2 className="mb-4">About this {isComposite ? 'offer' : 'resource'}</h2>
                <Markdown source={product.fullDescription} className="text-body-lg" />
              </div>

              {/* Included content for bundles / access plans */}
              {isComposite ? (
                <div className="mt-8">
                  <h2 className="mb-4">What’s included</h2>
                  {product.accessPeriod ? (
                    <p className="mb-4 text-ink-soft">
                      Access period: <strong>{product.accessPeriod === 'Year' ? 'Full year' : 'One term'}</strong>.{' '}
                      {product.deliveryRules}
                    </p>
                  ) : null}
                  {included.length > 0 ? (
                    <div className="space-y-2">
                      {included.map((entry) => (
                        <IncludedProduct key={entry.id} product={entry} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Included resources are being finalised.</p>
                  )}
                  {product.renewalNotes ? (
                    <p className="mt-4 text-body-sm text-muted">{product.renewalNotes}</p>
                  ) : null}
                </div>
              ) : null}

              {/* FAQ */}
              {faqs.length > 0 ? (
                <div className="mt-10">
                  <h2 className="mb-4">Questions about this resource</h2>
                  <FaqAccordion faqs={faqs} />
                </div>
              ) : null}
            </div>

            {/* Buy box */}
            <aside className="grid gap-[18px] rounded-card border border-line p-7 lg:sticky lg:top-[var(--sticky-offset)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={product.productKind === 'Bundle' ? 'solid' : product.productKind === 'Access Plan' ? 'outline' : 'neutral'}>
                  {product.productKind === 'Access Plan' ? 'Plan' : product.productKind}
                </Badge>
                <span className="text-caption font-semibold uppercase tracking-[0.14em] text-muted">
                  {product.grade} · {product.term}
                </span>
              </div>
              <div className="text-[1.7rem] font-bold leading-tight tracking-[-0.02em]">{product.title}</div>
              <div className="text-[2.4rem] font-semibold tracking-[-0.03em]">{priceLabel(product.priceZar)}</div>
              <ul className="grid gap-3">
                <SpecRow label="Grade" value={product.grade} />
                <SpecRow label="Term" value={product.term} />
                <SpecRow label="Year" value={product.year} />
                <SpecRow label="Subjects" value={product.subjects.join(', ') || '—'} />
                <SpecRow label="Type" value={product.productKind} />
                <SpecRow label="Format" value={product.resourceFormat} />
                <SpecRow label="Marks" value={product.marks ? `${product.marks} marks` : 'Not applicable'} />
                <SpecRow label="Delivery" value="Instant download on Order Detail" last />
              </ul>
              <Button type="button" variant="solid" className="w-full" onClick={() => addCartSlug(product.slug)}>
                <Icon name="cart" size={16} />
                Add to cart
              </Button>
              <p className="text-label text-muted">CAPS-aligned · Download after payment · Print at home</p>
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="section">
          <Container>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h2>Related resources</h2>
              <Link
                to={`/shop?grade=${encodeURIComponent(product.grade)}`}
                className="inline-flex items-center gap-1.5 border-b-[1.5px] border-current pb-0.5 font-medium hover:opacity-70"
              >
                See all
                <Icon name="arrow" size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
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
