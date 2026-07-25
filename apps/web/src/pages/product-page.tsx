import { Link, useParams } from 'react-router-dom'
import {
  getFaqsByIds,
  getProductBySlug,
  getProductsBySlugs,
  packageValue,
  packagesContaining,
  priceLabel,
  relatedProducts,
  type CmsSnapshot,
} from '@designing-minds/cms'
import { subjectAcronymsIn } from '../lib/subject-acronyms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { ArrowAffordance, Icon } from '../components/ui/icon'
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
  const value = isComposite ? packageValue(snapshot, product) : null
  // CMS bodies arrive empty or as a "." / ".." placeholder on several products.
  const hasDescription = product.fullDescription.replace(/[.\s]/g, '').length > 0
  const acronyms = subjectAcronymsIn(`${product.title} ${product.subjects.join(' ')}`)
  const inPackages = isComposite ? [] : packagesContaining(snapshot, product)

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
                <ProductCover product={product} className="max-w-[22rem]" priority />
              </div>

              {/* Description — CMS rich text stored as Markdown. Several products
                  carry an empty or placeholder body; an "About this resource"
                  heading over nothing reads worse than no section at all, so the
                  whole block is withheld until there is real copy. */}
              {hasDescription ? (
                <div className="mt-8 text-ink-soft">
                  <h2 className="mb-4">About this {isComposite ? 'offer' : 'resource'}</h2>
                  <Markdown source={product.fullDescription} className="text-body-lg" />
                </div>
              ) : null}

              {/* Included content for bundles / access plans */}
              {isComposite ? (
                <div className="mt-8">
                  <h2 className="mb-4">What’s included</h2>
                  {/* Derived from the included products themselves, so a bundle
                      states what you get and what it saves without waiting on new
                      CMS fields. Omitted entirely when nothing is listed yet. */}
                  {value ? (
                    <ul className="mb-4 grid gap-3">
                      <SpecRow label="Resources" value={`${value.itemCount} downloadable ${value.itemCount === 1 ? 'item' : 'items'}`} />
                      {value.subjects.length > 0 ? <SpecRow label="Subjects" value={value.subjects.join(', ')} /> : null}
                      {value.terms.length > 0 ? <SpecRow label="Covers" value={value.terms.join(', ')} /> : null}
                      <SpecRow
                        label="Bought singly"
                        value={
                          value.savingZar > 0
                            ? `${priceLabel(value.singlesTotalZar)} — this offer saves ${priceLabel(value.savingZar)} (${value.savingPercent}%)`
                            : priceLabel(value.singlesTotalZar)
                        }
                        last
                      />
                    </ul>
                  ) : null}
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

              {/* Buying for a class is a stated audience but was only discoverable
                  by guessing that Contact handles it. Say so where the decision
                  is made. */}
              <div className="mt-8 rounded-card border border-line p-5">
                <h2 className="text-[1.15rem]">Buying for a class?</h2>
                <p className="mt-1.5 text-body-sm text-ink-soft">
                  Classroom and multi-learner licensing is available for every resource and bundle — tell us the grade and
                  learner count and we’ll quote you.
                </p>
                <Button to="/contact" variant="text" className="mt-2">
                  Ask about classroom licensing
                  <ArrowAffordance size="md" />
                </Button>
              </div>

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
              {/* "English HL" / "Afrikaans FAL" appear in dozens of titles and were
                  never expanded anywhere on the site. Spelled out where the buyer
                  is deciding, and only for the codes this product actually uses. */}
              {acronyms.length > 0 ? (
                <p className="text-label text-muted">
                  {acronyms.map(({ code, meaning }) => `${code} = ${meaning}`).join(' · ')}
                </p>
              ) : null}
              <Button type="button" variant="solid" className="w-full" onClick={() => addCartSlug(product.slug)}>
                <Icon name="cart" size={16} />
                Add to cart
              </Button>
              {/* Cross-sell at the moment of purchase: this resource is already
                  paid for inside a cheaper-per-item package. Only shown when a
                  published package actually contains it. */}
              {inPackages.length > 0 ? (
                <div className="rounded-card bg-surface-alt p-4">
                  <span className="block text-label font-semibold text-ink">Also included in</span>
                  <ul className="mt-2 grid gap-2">
                    {inPackages.slice(0, 2).map((entry) => (
                      <li key={entry.id}>
                        <Link
                          to={`/shop/${entry.slug}`}
                          className="group flex items-baseline justify-between gap-3 text-body-sm hover:text-primary-ink"
                        >
                          <span className="font-semibold">{entry.title}</span>
                          <span className="whitespace-nowrap text-muted">{priceLabel(entry.priceZar)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
              {/* Was a one-off underlined link; the text Button is the site's
                  inline CTA and already carries focus, hover and colour. */}
              <Button to={`/shop?grade=${encodeURIComponent(product.grade)}`} variant="text">
                See all
                <ArrowAffordance size="md" />
              </Button>
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
