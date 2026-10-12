import { Link } from 'react-router-dom'
import { bundlesForGrade, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../ui/container'
import { BundleCard } from '../ui/bundle-card'
import { ArrowAffordance } from '../ui/icon'
import { LoadMoreButton } from '../ui/load-more-button'
import { CATALOG_INITIAL_LIMIT, useCatalogLoadMore } from '../../lib/deferred-catalog'

/**
 * Bundle-first entry point for a grade, shown ABOVE the single-resource grid.
 *
 * Uses the shared catalogue card so bundle descriptions, savings and basket
 * actions stay consistent with the shop and bundles pages.
 */
export function GradePackageSection({ snapshot, grade }: { snapshot: CmsSnapshot; grade: string }) {
  const packages = bundlesForGrade(snapshot, grade)
  const { visible: rendered, loadMore } = useCatalogLoadMore(packages, CATALOG_INITIAL_LIMIT, grade)
  if (packages.length === 0) return null

  return (
    <section className="section-tight border-b border-line bg-surface-alt">
      <Container width="full">
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

        <div className="catalog-grid mt-6">
          {rendered.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} snapshot={snapshot} />
          ))}
        </div>
        <LoadMoreButton remaining={packages.length - rendered.length} itemLabel="bundles" onLoadMore={loadMore} />
      </Container>
    </section>
  )
}
