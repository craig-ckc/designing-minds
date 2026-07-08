import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot, publishedProducts } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Placeholder } from '../ui/placeholder'
import { ProductCover } from '../ui/product-cover'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'
import fallbackGrades from '../../content/home/fallback-grades.json'

function HeroShowcase({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = useMemo(() => (snapshot?.valueLists.grades ?? fallbackGrades).slice(0, 5), [snapshot])
  const [active, setActive] = useState(0)
  const products = useMemo(() => (snapshot ? publishedProducts(snapshot) : []), [snapshot])
  const activeGrade = grades[active]

  const covers = useMemo(() => {
    const singles = products.filter((p) => p.productKind === 'Single')
    const matches = singles.filter((p) => p.grade === activeGrade)
    return (matches.length ? matches : singles).slice(0, 4)
  }, [products, activeGrade])

  const step = (dir: number) => setActive((a) => (a + dir + grades.length) % grades.length)

  return (
    <div className="mx-auto mt-12 max-w-wide lg:mt-14 text-left">
      <div className="mb-6 flex items-center justify-center gap-4 sm:gap-3">
        <Button
          type="button"
          aria-label="Previous subject"
          onClick={() => step(-1)}
          className="grid h-10 w-10 flex-none place-items-center rounded-pill border border-line bg-surface text-ink-soft shadow-soft transition-colors hover:text-ink"
        >
          <span className="h-4 w-4 rotate-180">
            <Icon name="arrow" />
          </span>
        </Button>
        <div className="flex items-center justify-center gap-1 rounded-pill border border-line bg-surface p-1 shadow-soft">
          {grades.map((g, i) => (
            <Button
              key={g}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-pill px-4 py-2 text-body-sm font-semibold transition-colors ${
                i === active ? 'bg-primary text-on-primary shadow-soft' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {g}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          aria-label="Next subject"
          onClick={() => step(1)}
          className="grid h-10 w-10 flex-none place-items-center rounded-pill border border-line bg-surface text-ink-soft shadow-soft transition-colors hover:text-ink"
        >
          <span className="h-4 w-4">
            <Icon name="arrow" />
          </span>
        </Button>
      </div>

      <div className="rounded-control border border-line bg-surface p-2 shadow-card sm:p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-label font-semibold text-muted">{activeGrade} · CAPS-aligned resources</span>
        </div>
        {covers.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {covers.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="block transition-transform hover:-translate-y-1">
                <ProductCover product={p} />
              </Link>
            ))}
          </div>
        ) : (
          <Placeholder ratio="16 / 7" />
        )}
      </div>
    </div>
  )
}

export function HomeHeroSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  return (
    <Section className="bg-cream" containerClassName="py-16 text-center lg:py-24" spacing="none">
      <Link
        to="/shop"
        className="inline-flex items-center gap-4 rounded-pill border border-primary/20 bg-primary-tint px-4 py-1.5 text-label font-bold text-primary transition-colors hover:bg-primary/10"
      >
        New · Term 4 resources for Grades 3–7
        <span className="h-3.5 w-3.5">
          <Icon name="arrow" />
        </span>
      </Link>
      <h1 className="mx-auto mt-6 max-w-[15ch]">Practice resources that build confidence at home</h1>
      <p className="mx-auto mt-5 max-w-narrow text-body-lg leading-[1.55] text-ink-soft">
        Teacher-made, parent-tested printable tests and summaries for Grades 3 to 7 — bought once, downloaded
        instantly, printed as often as you like.
      </p>
      <div className="mt-7 flex justify-center">
        <Button to="/shop" variant="solid">
          Browse resources
          <span className="h-4 w-4">
            <Icon name="arrow" />
          </span>
        </Button>
      </div>
      <div className="mt-5 flex items-center justify-center gap-4 text-body-sm text-ink-soft">
        <StarRating size="sm" className="text-[1rem]" />
        <span className="font-semibold text-ink">Loved by 70+ families</span> across South Africa
      </div>
      <HeroShowcase snapshot={snapshot} />
    </Section>
  )
}
