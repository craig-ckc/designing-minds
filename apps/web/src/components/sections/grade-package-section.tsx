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
 * Uses the same heading, grid and bundle cards as the other catalogue views,
 * regardless of how many bundles a grade has.
 */
export function GradePackageSection({ snapshot, grade }: { snapshot: CmsSnapshot; grade: string }) {
  const packages = bundlesForGrade(snapshot, grade)
  const { visible: rendered, loadMore } = useCatalogLoadMore(packages, CATALOG_INITIAL_LIMIT, grade)
  if (packages.length === 0) return null

  return (
    <section className="section-tight border-b border-line" aria-label={`${grade} bundles`}>
      <Container width="full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-body-lg font-semibold tracking-normal">Bundles for {grade}</h2>
          <Link
            to={`/packages?grade=${encodeURIComponent(grade)}`}
            className="group inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary-ink hover:text-primary-ink-strong"
          >
            View all bundles
            <ArrowAffordance size="md" />
          </Link>
        </div>

        <div className="catalog-grid">
          {rendered.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} snapshot={snapshot} />
          ))}
        </div>
        <LoadMoreButton remaining={packages.length - rendered.length} itemLabel="bundles" onLoadMore={loadMore} />
      </Container>
    </section>
  )
}
