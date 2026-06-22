import { Link, useParams } from 'react-router-dom'
import {
  getFaqsByIds,
  getProductBySlug,
  getProductsBySlugs,
  getSubjectsForProduct,
  priceLabel,
  relatedProducts,
  type CmsSnapshot,
} from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { FaqAccordion } from '../components/ui/FaqAccordion'
import { ProductCard } from '../components/ProductCard'
import { SpecRow } from '../components/SpecRow'
import { NotFoundPage } from './NotFoundPage'

export function ProductPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const product = slug ? getProductBySlug(snapshot, slug) : undefined

  if (!product) {
    return <NotFoundPage />
  }

  const subjects = getSubjectsForProduct(snapshot, product)
  const faqs = getFaqsByIds(snapshot, product.faqs)
  const included = getProductsBySlugs(snapshot, product.includedProductSlugs ?? [])
  const related = relatedProducts(snapshot, product, 3)
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

          <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <Placeholder label={`${product.resourceFormat} preview`} ratio="4 / 3.2" />

              {/* Preview files */}
              {product.previewFiles.length > 0 ? (
                <div className="mt-6">
                  <h4 className="mb-3">Preview files</h4>
                  <ul className="grid gap-2">
                    {product.previewFiles.map((file) => (
                      <li key={file.id}>
                        <button type="button" className="flex w-full items-center gap-3 border border-line px-4 py-3 text-left hover:border-ink">
                          <span className="h-4 w-4 text-muted">
                            <Icon name="doc" />
                          </span>
                          <span className="flex-1">{file.label}</span>
                          <span className="text-[0.82rem] text-muted">Preview</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Description */}
              <div className="mt-8 text-ink-soft">
                <h3 className="mb-4">About this {isComposite ? 'offer' : 'resource'}</h3>
                <p className="text-[1.02rem]">{product.fullDescription}</p>
              </div>

              {/* Included content for bundles / access plans */}
              {isComposite ? (
                <div className="mt-8">
                  <h3 className="mb-4">What’s included</h3>
                  {product.accessPeriod ? (
                    <p className="mb-4 text-ink-soft">
                      Access period: <strong>{product.accessPeriod === 'Year' ? 'Full year' : 'One term'}</strong>.{' '}
                      {product.deliveryRules}
                    </p>
                  ) : null}
                  {included.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {included.map((entry) => (
                        <ProductCard key={entry.id} product={entry} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Included resources are being finalised.</p>
                  )}
                  {product.renewalNotes ? (
                    <p className="mt-4 text-[0.9rem] text-muted">{product.renewalNotes}</p>
                  ) : null}
                </div>
              ) : null}

              {/* FAQ */}
              {faqs.length > 0 ? (
                <div className="mt-10">
                  <h3 className="mb-4">Questions about this resource</h3>
                  <FaqAccordion faqs={faqs} />
                </div>
              ) : null}
            </div>

            {/* Buy box */}
            <aside className="grid gap-[18px] rounded-[10px] border border-line p-7 lg:sticky lg:top-24">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={product.productKind === 'Bundle' ? 'solid' : product.productKind === 'Access Plan' ? 'outline' : 'neutral'}>
                  {product.productKind}
                </Badge>
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  {product.grade} · {product.term}
                </span>
              </div>
              <h1 className="text-[1.7rem]">{product.title}</h1>
              <div className="text-[2.4rem] font-semibold tracking-[-0.03em]">{priceLabel(product.priceZar)}</div>
              <ul className="grid gap-3">
                <SpecRow label="Grade" value={product.grade} />
                <SpecRow label="Term" value={product.term} />
                <SpecRow label="Year" value={product.year} />
                <SpecRow label="Subjects" value={subjects.map((s) => s.shortLabel).join(', ') || '—'} />
                <SpecRow label="Type" value={product.productKind} />
                <SpecRow label="Format" value={product.resourceFormat} />
                <SpecRow label="Marks" value={product.marks ? `${product.marks} marks` : 'Not applicable'} />
                <SpecRow label="Delivery" value="Instant download on Order Detail" last />
              </ul>
              <Button type="button" variant="solid" className="w-full">
                <span className="h-4 w-4">
                  <Icon name="cart" />
                </span>
                Add to cart
              </Button>
              <p className="text-[0.82rem] text-muted">CAPS-aligned · Download after payment · Print at home</p>
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="section bg-surface-alt">
          <Container>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h3>Related resources</h3>
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
