import { Link, useParams } from 'react-router-dom'
import {
  bundleContents,
  bundleValue,
  bundlesContaining,
  getCatalogItemBySlug,
  getFaqsByIds,
  priceLabel,
  relatedProducts,
  type Bundle,
  type CmsSnapshot,
  type Product,
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

/**
 * /shop/<slug> serves both Collections — products and bundles share the URL
 * space, and a shopper shouldn't have to know which one they're looking at.
 * The slug is resolved once here and the two detail views are kept separate
 * rather than braided together with conditionals, because past the shared
 * chrome they genuinely show different things.
 */
export function ProductPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const item = slug ? getCatalogItemBySlug(snapshot, slug) : undefined

  if (!item) return <NotFoundPage />
  if (item.kind === 'bundle') {
    return item.bundle.published ? <BundleDetail bundle={item.bundle} snapshot={snapshot} /> : <NotFoundPage />
  }
  return item.product.published ? <ResourceDetail product={item.product} snapshot={snapshot} /> : <NotFoundPage />
}

/* CMS bodies arrive empty or as a "." / ".." placeholder on several records. */
const hasRealCopy = (value: string) => value.replace(/[.\s]/g, '').length > 0

/** Shared trailing sections: classroom licensing, then the record's FAQs. */
function DetailFooterBlocks({ faqs, subject }: { faqs: ReturnType<typeof getFaqsByIds>; subject: string }) {
  return (
    <>
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

      {faqs.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-4">Questions about this {subject}</h2>
          <FaqAccordion faqs={faqs} />
        </div>
      ) : null}
    </>
  )
}

/* ----------------------------- Single resource -------------------------- */

function ResourceDetail({ product, snapshot }: { product: Product; snapshot: CmsSnapshot }) {
  const faqs = getFaqsByIds(snapshot, product.faqs)
  const related = relatedProducts(snapshot, product, 4)
  const acronyms = subjectAcronymsIn(`${product.title} ${product.subjects.join(' ')}`)
  // Cross-sell at the moment of purchase: this resource is already paid for
  // inside a cheaper-per-item bundle.
  const inBundles = bundlesContaining(snapshot, product)

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

              {/* An "About this resource" heading over nothing reads worse than
                  no section at all, so the block waits for real copy. */}
              {hasRealCopy(product.fullDescription) ? (
                <div className="mt-8 text-ink-soft">
                  <h2 className="mb-4">About this resource</h2>
                  <Markdown source={product.fullDescription} className="text-body-lg" />
                </div>
              ) : null}

              <DetailFooterBlocks faqs={faqs} subject="resource" />
            </div>

            <aside className="grid gap-[18px] rounded-card border border-line p-7 lg:sticky lg:top-[var(--sticky-offset)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{product.resourceFormat}</Badge>
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
              {inBundles.length > 0 ? (
                <div className="rounded-card bg-surface-alt p-4">
                  <span className="block text-label font-semibold text-ink">Also included in</span>
                  <ul className="mt-2 grid gap-2">
                    {inBundles.slice(0, 2).map((entry) => (
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

/* --------------------------------- Bundle ------------------------------- */

function BundleDetail({ bundle, snapshot }: { bundle: Bundle; snapshot: CmsSnapshot }) {
  const faqs = getFaqsByIds(snapshot, bundle.faqs)
  const contents = bundleContents(snapshot, bundle)
  // Value is derived from the members, so the saving can never contradict the
  // list underneath it. Null when nothing published is listed yet.
  const value = bundleValue(snapshot, bundle)
  const subjects = [...new Set(contents.flatMap((product) => product.subjects))]

  return (
    <section className="section">
      <Container>
        <Breadcrumb
          trail={[
            { to: '/', label: 'Home' },
            { to: '/shop', label: 'Shop' },
          ]}
          current={bundle.title}
        />
        <h1 className="sr-only">{bundle.title}</h1>

        <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <div className="flex justify-center px-8 py-4 sm:px-12">
              <ProductCover
                product={{ title: bundle.title, grade: bundle.grade, term: bundle.term, subjects }}
                stacked
                className="max-w-[22rem]"
                priority
              />
            </div>

            {hasRealCopy(bundle.fullDescription) ? (
              <div className="mt-8 text-ink-soft">
                <h2 className="mb-4">About this bundle</h2>
                <Markdown source={bundle.fullDescription} className="text-body-lg" />
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="mb-4">What’s included</h2>
              {value ? (
                <ul className="mb-4 grid gap-3">
                  <SpecRow label="Resources" value={`${value.itemCount} downloadable ${value.itemCount === 1 ? 'item' : 'items'}`} />
                  {value.subjects.length > 0 ? <SpecRow label="Subjects" value={value.subjects.join(', ')} /> : null}
                  {value.terms.length > 0 ? <SpecRow label="Covers" value={value.terms.join(', ')} /> : null}
                  <SpecRow
                    label="Bought singly"
                    value={
                      value.savingZar > 0
                        ? `${priceLabel(value.singlesTotalZar)} — this bundle saves ${priceLabel(value.savingZar)} (${value.savingPercent}%)`
                        : priceLabel(value.singlesTotalZar)
                    }
                    last
                  />
                </ul>
              ) : null}
              {contents.length > 0 ? (
                <div className="space-y-2">
                  {contents.map((entry) => (
                    <IncludedProduct key={entry.id} product={entry} />
                  ))}
                </div>
              ) : (
                <p className="text-muted">Included resources are being finalised.</p>
              )}
            </div>

            <DetailFooterBlocks faqs={faqs} subject="bundle" />
          </div>

          <aside className="grid gap-[18px] rounded-card border border-line p-7 lg:sticky lg:top-[var(--sticky-offset)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="solid">Bundle</Badge>
              <span className="text-caption font-semibold uppercase tracking-[0.14em] text-muted">
                {bundle.grade} · {bundle.term}
              </span>
            </div>
            <div className="text-[1.7rem] font-bold leading-tight tracking-[-0.02em]">{bundle.title}</div>
            <div className="text-[2.4rem] font-semibold tracking-[-0.03em]">{priceLabel(bundle.priceZar)}</div>
            {value && value.savingZar > 0 ? (
              <p className="text-body-sm font-semibold text-primary-ink">
                Saves {priceLabel(value.savingZar)} against buying these separately
              </p>
            ) : null}
            <ul className="grid gap-3">
              <SpecRow label="Grade" value={bundle.grade} />
              <SpecRow label="Covers" value={bundle.bundleScope === 'Full Year' ? 'Full year' : bundle.term} />
              <SpecRow label="Year" value={bundle.year} />
              <SpecRow label="Resources" value={contents.length > 0 ? String(contents.length) : '—'} />
              <SpecRow label="Subjects" value={subjects.join(', ') || '—'} />
              <SpecRow label="Delivery" value="Instant download on Order Detail" last />
            </ul>
            <Button type="button" variant="solid" className="w-full" onClick={() => addCartSlug(bundle.slug)}>
              <Icon name="cart" size={16} />
              Add to cart
            </Button>
            <p className="text-label text-muted">CAPS-aligned · Download after payment · Print at home</p>
          </aside>
        </div>
      </Container>
    </section>
  )
}
