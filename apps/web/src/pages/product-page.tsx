import { CatalogPrice } from '../components/ui/catalog-price'
import { Link, useParams } from 'react-router-dom'
import {
  bundleContents,
  bundleValue,
  bundlesContaining,
  getCatalogItemBySlug,
  getFaqsByIds,
  priceLabel,
  relatedProducts,
  relatedBundles,
  type Bundle,
  type CmsSnapshot,
  type PreviewPdf,
  type Product,
} from '@designing-minds/cms'
import { previewDownloadHref } from '../lib/preview-pdf'
import { subjectAcronymsIn } from '../lib/subject-acronyms'
import { countLabel } from '../lib/product-attributes'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { ArrowAffordance, Icon } from '../components/ui/icon'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { DetailDisclosure } from '../components/ui/detail-disclosure'
import { FaqAccordion } from '../components/ui/faq-accordion'
import { IncludedProduct } from '../components/ui/included-product'
import { ProductCard } from '../components/ui/product-card'
import { BundleCard } from '../components/ui/bundle-card'
import { ProductGallery } from '../components/ui/product-gallery'
import { MobileProductPreview } from '../components/ui/mobile-product-preview'
import { PhysicalProductDetail } from '../components/physical-product-detail'
import { RelatedPhysicalProducts } from '../components/related-physical-products'
import { SpecRow } from '../components/ui/spec-row'
import { addCartSlug } from '../lib/cart'
import { useCatalogSnapshot } from '../lib/catalog'
import { Markdown } from '../lib/markdown'
import { NotFoundPage } from './not-found-page'

/**
 * /shop/<slug> serves both Collections — products and bundles share the URL
 * space, and a shopper shouldn't have to know which one they're looking at.
 * The slug is resolved once here and the two detail views are kept separate
 * rather than braided together with conditionals, because past the shared
 * chrome they genuinely show different things.
 */
export function ProductPage() {
  const snapshot = useCatalogSnapshot()
  const { slug } = useParams()
  const physical = snapshot.physicalCatalog?.find((product) => product.slug === slug)
  const item = slug ? getCatalogItemBySlug(snapshot, slug) : undefined

  if (physical) return (
    <>
      <PhysicalProductDetail key={physical.id} product={physical} />
      <RelatedPhysicalProducts product={physical} catalog={snapshot.physicalCatalog ?? []} />
    </>
  )
  if (!item) return <NotFoundPage />
  if (item.kind === 'bundle') {
    return item.bundle.published ? <BundleDetail bundle={item.bundle} snapshot={snapshot} /> : <NotFoundPage />
  }
  return item.product.published ? <ResourceDetail product={item.product} snapshot={snapshot} /> : <NotFoundPage />
}

/* CMS bodies arrive empty or as a "." / ".." placeholder on several records. */
const hasRealCopy = (value: string) => value.replace(/[.\s]/g, '').length > 0

function ResourceLicenceNotice() {
  return (
    <div className="space-y-2 text-sm text-ink-soft">
      <p>This resource is for personal/household or single-classroom use only.</p>
      <p className="mt-2">
        Your purchase may not be shared, forwarded, resold, uploaded or distributed to other parents, teachers,
        classrooms or online groups. Each additional user/classroom must purchase their own copy or licence.
      </p>
      <p className="mt-2">All Designing Minds resources are protected by copyright.</p>
      <p className="mt-2">
        By purchasing this resource, you agree to our{' '}
        <Link to="/terms" className="font-semibold text-primary-ink underline underline-offset-4 hover:text-primary-ink-strong">
          Terms of Use
        </Link>
        .
      </p>
    </div>
  )
}

/** Shared trailing sections: classroom licensing, then the record's FAQs. */
function DetailFooterBlocks({ faqs, subject }: { faqs: ReturnType<typeof getFaqsByIds>; subject: string }) {
  return (
    <>
      <DetailDisclosure title="Buying for a class?">
        <p className="mt-2 text-body text-ink-soft">
          Classroom and multi-learner licensing is available for every resource and bundle — tell us the grade and
          learner count and we’ll quote you. A standard purchase covers one household or one classroom; the{' '}
          <Link to="/help#licensing" className="font-semibold text-primary-ink underline underline-offset-4 hover:text-primary-ink-strong">
            licensing FAQ
          </Link>{' '}
          explains what that includes.
        </p>
        <Button to="/contact" variant="text" className="mt-2">
          Ask about classroom licensing
          <ArrowAffordance size="md" />
        </Button>
      </DetailDisclosure>

      {faqs.length > 0 ? (
        <DetailDisclosure title={`Questions about this ${subject}`}>
          <FaqAccordion faqs={faqs} keepMounted />
        </DetailDisclosure>
      ) : null}
    </>
  )
}

/**
 * Free-preview block, shared by both detail views. Callers guard with
 * `(record.previewPdfs ?? []).length > 0` — this component always renders
 * whatever it's given, so an empty array is never handed to it.
 */
function PreviewPdfSection({ pdfs, subject }: { pdfs: PreviewPdf[]; subject: string }) {
  return (
    <DetailDisclosure title="Preview before you buy">
      <p className="mt-2 text-body text-ink-soft">Download a free sample PDF of this {subject} before you buy.</p>
      <div className="mt-4 grid gap-2">
        {pdfs.map((pdf) => (
          // A real cross-origin download, not a route — Button's `href` branch
          // renders a plain anchor rather than a router Link.
          <Button
            key={pdf.id}
            href={previewDownloadHref(pdf)}
            rel="noopener"
            variant="solid-light"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-3 truncate">
              <Icon name="doc" size={18} />
              <span className="truncate">{pdf.label}</span>
            </span>
            <Icon name="download" size={16} />
          </Button>
        ))}
      </div>
    </DetailDisclosure>
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
  const previewPdfs = product.previewPdfs ?? []

  return (
    <>
      <section className="product-detail py-8 sm:py-10 lg:py-12">
        <Container width="full">
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
            ]}
            current={product.title}
          />

          {/* min-w-0 on both columns: a grid item's default minimum is its
              min-content, so one non-wrapping row inside a column could widen
              the whole page instead of wrapping or scrolling within it. */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 xl:gap-16">
            <div id="product-preview" tabIndex={-1} className="min-w-0 scroll-mt-[var(--sticky-offset)] lg:sticky lg:top-[var(--sticky-offset)]">
              <ProductGallery item={product} images={product.galleryImages ?? []} />
            </div>

            <aside className="order-first grid min-w-0 gap-4 rounded-md border border-line p-5 sm:p-6 lg:order-none lg:p-8">
              <div className="flow-root">
                <MobileProductPreview item={product} />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{product.resourceFormat}</Badge>
                  <span className="text-caption font-semibold uppercase tracking-[0.14em] text-muted">
                    {product.grade} · {product.term}
                  </span>
                </div>
                <h1 className="text-2xl mt-3 font-bold leading-snug tracking-[-0.02em]">{product.title}</h1>
                {product.shortDescription.trim() ? <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p> : null}
              </div>
              <div className="text-[1.75rem] font-semibold leading-snug tracking-[-0.03em]"><CatalogPrice record={product} /></div>
              <Button type="button" variant="solid" className="w-full" onClick={() => addCartSlug(product.slug)}>
                <Icon name="cart" size={16} />
                Add to cart
              </Button>
              <p className="text-sm text-muted">CAPS-aligned · Download after payment · Print at home</p>
              <div className="border-t border-line">
                <DetailDisclosure title="Resource details" defaultOpen>
                  <ul className="grid gap-3">
                    <SpecRow label="Grade" value={product.grade} />
                    <SpecRow label="Term" value={product.term} />
                    <SpecRow label="Year" value={product.year} />
                    <SpecRow label="Subjects" value={product.subjects.join(', ') || '—'} />
                    <SpecRow label="Format" value={product.resourceFormat} />
                    <SpecRow label="Marks" value={product.marks ? `${product.marks} marks` : 'Not applicable'} />
                    <SpecRow label="Delivery" value="Instant download on your order page" last />
                  </ul>
                  {acronyms.length > 0 ? (
                    <p className="mt-3 text-sm text-muted">
                      {acronyms.map(({ code, meaning }) => `${code} = ${meaning}`).join(' · ')}
                    </p>
                  ) : null}
                </DetailDisclosure>
                {hasRealCopy(product.fullDescription) ? (
                  <DetailDisclosure title="About this resource">
                    <Markdown source={product.fullDescription} className="text-sm" />
                  </DetailDisclosure>
                ) : null}
                {previewPdfs.length > 0 ? <PreviewPdfSection pdfs={previewPdfs} subject="resource" /> : null}
                <DetailDisclosure title="Resource licence">
                  <ResourceLicenceNotice />
                </DetailDisclosure>
                <DetailFooterBlocks faqs={faqs} subject="resource" />
              </div>
              {inBundles.length > 0 ? (
                <div className="rounded-md bg-surface-alt p-4">
                  <span className="block text-label font-semibold text-ink">Also included in</span>
                  <ul className="mt-2 grid gap-2">
                    {inBundles.slice(0, 2).map((entry) => (
                      <li key={entry.id}>
                        <Link
                          to={`/shop/${entry.slug}`}
                          className="group flex items-baseline justify-between gap-3 text-body hover:text-primary-ink"
                        >
                          <span className="font-semibold">{entry.title}</span>
                          <span className="whitespace-nowrap text-muted"><CatalogPrice record={entry} /></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="product-detail py-8 sm:py-10 lg:py-12">
          <Container width="full">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-xl font-bold leading-snug tracking-normal">Related resources</h2>
              <Button to={`/shop?grade=${encodeURIComponent(product.grade)}`} variant="text">
                See all
                <ArrowAffordance size="md" />
              </Button>
            </div>
            <div className="catalog-grid">
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
  const previewPdfs = bundle.previewPdfs ?? []
  const related = relatedBundles(snapshot, bundle, 4)

  return (
    <>
      <section className="product-detail py-8 sm:py-10 lg:py-12">
        <Container width="full">
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
            ]}
            current={bundle.title}
          />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 xl:gap-16">
            <div id="product-preview" tabIndex={-1} className="min-w-0 scroll-mt-[var(--sticky-offset)] lg:sticky lg:top-[var(--sticky-offset)]">
              <ProductGallery
                item={{ id: bundle.id, title: bundle.title, grade: bundle.grade, term: bundle.term, subjects }}
                images={bundle.galleryImages ?? []}
                stacked
              />
            </div>

            <aside className="order-first grid min-w-0 gap-4 rounded-md border border-line p-5 sm:p-6 lg:order-none lg:p-8">
              <div className="flow-root">
                <MobileProductPreview item={{ id: bundle.id, title: bundle.title, grade: bundle.grade, term: bundle.term, subjects }} stacked />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="solid">Bundle</Badge>
                  <span className="text-caption font-semibold uppercase tracking-[0.14em] text-muted">
                    {bundle.grade} · {bundle.term}
                  </span>
                </div>
                <h1 className="text-2xl mt-3 font-bold leading-snug tracking-[-0.02em]">{bundle.title}</h1>
                {bundle.shortDescription.trim() ? <p className="mt-3 text-sm leading-relaxed text-ink-soft">{bundle.shortDescription}</p> : null}
              </div>
              <div className="text-[1.75rem] font-semibold leading-snug tracking-[-0.03em]"><CatalogPrice record={bundle} compareAtPriceZar={value?.singlesTotalZar} /></div>
              <Button type="button" variant="solid" className="w-full" onClick={() => addCartSlug(bundle.slug)}>
                <Icon name="cart" size={16} />
                Add to cart
              </Button>
              <p className="text-sm text-muted">CAPS-aligned · Download after payment · Print at home</p>
              <div className="border-t border-line">
                <DetailDisclosure title="Bundle details">
                  {value && value.savingZar > 0 ? (
                    <p className="mb-4 text-sm font-semibold text-primary-ink">
                      Saves {priceLabel(value.savingZar)} against buying these separately
                    </p>
                  ) : null}
                  <ul className="grid gap-3">
                    <SpecRow label="Grade" value={bundle.grade} />
                    <SpecRow label="Covers" value={bundle.bundleScope === 'Full Year' ? 'Full year' : bundle.term} />
                    <SpecRow label="Year" value={bundle.year} />
                    <SpecRow label="Resources" value={contents.length > 0 ? String(contents.length) : '—'} />
                    <SpecRow label="Subjects" value={subjects.join(', ') || '—'} />
                    <SpecRow label="Delivery" value="Instant download on your order page" last />
                  </ul>
                </DetailDisclosure>
                {hasRealCopy(bundle.fullDescription) ? (
                  <DetailDisclosure title="About this bundle">
                    <Markdown source={bundle.fullDescription} className="text-sm" />
                  </DetailDisclosure>
                ) : null}

                <DetailDisclosure title={`What’s included${contents.length > 0 ? ` (${countLabel(contents.length, 'resource')})` : ''}`}>
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
                </DetailDisclosure>

                {previewPdfs.length > 0 ? <PreviewPdfSection pdfs={previewPdfs} subject="bundle" /> : null}
                <DetailDisclosure title="Resource licence">
                  <ResourceLicenceNotice />
                </DetailDisclosure>
                <DetailFooterBlocks faqs={faqs} subject="bundle" />
              </div>
            </aside>
          </div>
        </Container>
      </section>
      {related.length > 0 ? (
        <section className="product-detail py-8 sm:py-10 lg:py-12">
          <Container width="full">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-xl font-bold leading-snug tracking-normal">More bundles to explore</h2>
              <Button to={`/packages?grade=${encodeURIComponent(bundle.grade)}`} variant="text">
                See all bundles
                <ArrowAffordance size="md" />
              </Button>
            </div>
            <div className="catalog-grid">
              {related.map((entry) => (
                <BundleCard key={entry.id} bundle={entry} snapshot={snapshot} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
