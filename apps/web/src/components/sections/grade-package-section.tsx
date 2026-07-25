import { Link } from 'react-router-dom'
import { type CmsSnapshot, packageValue, packagesForGrade, priceLabel } from '@designing-minds/cms'
import { Container } from '../ui/container'
import { Badge } from '../ui/badge'
import { ArrowAffordance } from '../ui/icon'

/**
 * Bundle-first entry point for a grade, shown ABOVE the single-resource grid.
 *
 * A visitor choosing a grade previously met a wall of R50–R60 single tests and
 * found bundles only in a text link below the fold, so singles were the default
 * choice by layout. Every number here is derived from the packages' own included
 * products — no new CMS fields, and nothing is claimed when a package lists
 * nothing yet (packageValue returns null and the saving line is omitted rather
 * than showing R0).
 */
export function GradePackageSection({ snapshot, grade }: { snapshot: CmsSnapshot; grade: string }) {
  const packages = packagesForGrade(snapshot, grade)
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
            Compare all bundles &amp; plans
            <ArrowAffordance size="md" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((product) => {
            const value = packageValue(snapshot, product)
            return (
              <Link
                key={product.id}
                to={`/shop/${product.slug}`}
                className="group flex flex-col rounded-card border border-line bg-surface p-5 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* Deliberately not the `solid` tone: white on the brand pink
                      measures 3.22:1, and this section must not add a new
                      instance of the contrast debt it inherited. */}
                  <Badge tone={product.productKind === 'Bundle' ? 'neutral' : 'outline'}>
                    {product.productKind === 'Access Plan' ? 'Plan' : product.productKind}
                  </Badge>
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
                      {priceLabel(product.priceZar)}
                    </span>
                    {value && value.savingZar > 0 ? (
                      <span className="mt-1 block text-caption text-muted">
                        <s>{priceLabel(value.singlesTotalZar)}</s> bought singly
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
      </Container>
    </section>
  )
}
