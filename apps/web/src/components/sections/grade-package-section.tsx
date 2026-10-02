import { CatalogPrice } from '../ui/catalog-price'
import { Link } from 'react-router-dom'
import { bundleValue, bundlesForGrade, priceLabel, promotionPrice, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../ui/container'
import { Badge } from '../ui/badge'
import { ArrowAffordance } from '../ui/icon'
import { LoadMoreButton } from '../ui/load-more-button'
import { CATALOG_INITIAL_LIMIT, useCatalogLoadMore } from '../../lib/deferred-catalog'
import { perResourceZar } from '../../lib/product-attributes'

/**
 * Bundle-first entry point for a grade, shown ABOVE the single-resource grid.
 *
 * A visitor choosing a grade previously met a wall of R50–R60 single tests and
 * found bundles only in a text link below the fold, so singles were the default
 * choice by layout. Every number here is derived from the bundle's own members,
 * and nothing is claimed when a bundle lists nothing yet (bundleValue returns
 * null and the saving line is omitted rather than showing R0).
 */
export function GradePackageSection({ snapshot, grade }: { snapshot: CmsSnapshot; grade: string }) {
  const packages = bundlesForGrade(snapshot, grade)
  const { visible: rendered, loadMore } = useCatalogLoadMore(packages, CATALOG_INITIAL_LIMIT, grade)
  if (packages.length === 0) return null

  return (
    <section className="section-tight border-b border-line bg-surface-alt">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2>Cover {grade} in one purchase</h2>
            <p className="mt-1.5 max-w-prose text-muted">
              Buying the term or full year together costs less than the same resources one at a time.
            </p>
          </div>
          <Link
            to={`/packages?grade=${encodeURIComponent(grade)}`}
            className="group inline-flex items-center gap-1.5 font-semibold text-primary-ink hover:text-primary-ink-strong"
          >
            Compare all bundles
            <ArrowAffordance size="md" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rendered.map((product) => {
            const value = bundleValue(snapshot, product)
            const perResource = value ? perResourceZar(promotionPrice(product), value.itemCount) : null
            return (
              <Link
                key={product.id}
                to={`/shop/${product.slug}`}
                className="catalog-card catalog-card-bundle group flex flex-col rounded-card border border-line bg-surface p-5 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* Neutral rather than `solid`: the scope label is secondary
                      and must not compete with the saving callout beside it. */}
                  <Badge tone="neutral">{product.bundleScope === 'Full Year' ? 'Full year' : 'Term'}</Badge>
                  {value && value.savingPercent > 0 ? (
                    <span className="text-caption font-bold uppercase tracking-[0.08em] text-primary-ink">
                      Save {value.savingPercent}%
                    </span>
                  ) : null}
                </div>

                <span className="mt-3 block font-bold text-ink">{product.title}</span>

                {value ? (
                  <span className="mt-1.5 block text-body-sm text-muted">
                    {value.itemCount} resources
                    {value.subjects.length > 0 ? ` · ${value.subjects.length} subjects` : ''}
                    {value.terms.length > 1 ? ` · ${value.terms.length} terms` : ''}
                  </span>
                ) : (
                  <span className="mt-1.5 block text-body-sm text-muted">Included resources are being finalised.</span>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <span>
                    <span className="block text-[1.4rem] font-extrabold leading-none tracking-[-0.02em]">
                      <CatalogPrice record={product} />
                    </span>
                    {value && value.savingZar > 0 ? (
                      <span className="mt-1 block text-caption text-muted">
                        <s>{priceLabel(value.singlesTotalZar)}</s> bought singly
                        {perResource ? ` · about ${priceLabel(perResource)} each` : ''}
                      </span>
                    ) : null}
                  </span>
                  <span className="inline-flex items-center gap-1 text-label font-bold text-primary-ink">
                    View
                    <ArrowAffordance />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
        <LoadMoreButton remaining={packages.length - rendered.length} itemLabel="bundles" onLoadMore={loadMore} />
      </Container>
    </section>
  )
}
