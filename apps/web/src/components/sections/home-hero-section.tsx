import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@designing-minds/utils'
import { type CmsSnapshot, publishedProducts } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Placeholder } from '../ui/placeholder'
import { ProductCover } from '../ui/product-cover'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'
import fallbackGrades from '../../content/home/fallback-grades.json'

/** Auto-advance cadence for the grade carousel. */
const INTERVAL_MS = 6000
/** Countdown ring geometry (drawn in a 44×44 box, hugging the button edge). */
const RING_R = 20
const RING_C = 2 * Math.PI * RING_R

/** Circular nav control: warm track → white inner disc with a soft lift → arrow. */
function ArrowButton({
  direction,
  label,
  onClick,
  children,
}: {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
  children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group relative grid h-11 w-11 flex-none place-items-center rounded-pill bg-surface-sunk transition-[background-color] hover:bg-line-strong active:scale-[0.96]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-pill bg-surface shadow-soft transition-shadow duration-200 group-hover:shadow-card">
        <span className={cn('h-[18px] w-[18px] text-muted transition-colors group-hover:text-ink', direction === 'prev' && 'rotate-180')}>
          <Icon name="arrow" />
        </span>
      </span>
      {children}
    </button>
  )
}

function HeroShowcase({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = useMemo(() => (snapshot?.valueLists.grades ?? fallbackGrades).slice(0, 5), [snapshot])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  // Bumped on any manual navigation so the countdown restarts from zero.
  const [cycle, setCycle] = useState(0)
  const ringRef = useRef<SVGCircleElement>(null)
  const products = useMemo(() => (snapshot ? publishedProducts(snapshot) : []), [snapshot])
  const activeGrade = grades[active]

  const covers = useMemo(() => {
    const singles = products.filter((p) => p.productKind === 'Single')
    const matches = singles.filter((p) => p.grade === activeGrade)
    return (matches.length ? matches : singles).slice(0, 4)
  }, [products, activeGrade])

  const select = (i: number) => {
    setActive(i)
    setCycle((c) => c + 1)
  }
  const step = (dir: number) => select((active + dir + grades.length) % grades.length)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // One clock drives both the ring fill and the auto-advance, so they stay in
  // sync and freeze together on hover. Ring offset is written imperatively to
  // avoid a React re-render every animation frame.
  useEffect(() => {
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_C)
    if (paused || reduced || grades.length < 2) return
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const progress = Math.min((t - start) / INTERVAL_MS, 1)
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_C * (1 - progress))
      if (progress >= 1) {
        start = t
        setActive((a) => (a + 1) % grades.length)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused, reduced, cycle, grades.length])

  return (
    <div
      className="mx-auto mt-12 max-w-wide text-left lg:mt-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-6 flex items-center justify-center gap-2 sm:gap-2.5">
        <ArrowButton direction="prev" label="Previous grade" onClick={() => step(-1)} />

        <div
          role="tablist"
          aria-label="Choose a grade"
          className="relative flex rounded-pill border border-line bg-surface-sunk p-1"
        >
          {/* Sliding white pill under the active grade. Each tab is a fixed,
              equal width, so the highlight is exactly one tab wide and moves
              in whole-tab steps. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0.75 left-1 rounded-pill bg-surface shadow-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `calc((100% - 0.5rem) / ${grades.length})`, transform: `translateX(${active * 100}%)` }}
          />
          {grades.map((g, i) => {
            const num = g.replace(/\D+/g, '') || g
            return (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={g}
                onClick={() => select(i)}
                className={cn(
                  'relative z-10 w-10 rounded-pill py-1 px-6 text-center text-body-sm font-semibold transition-colors w-fit',
                  i === active ? 'text-primary' : 'text-ink-soft hover:text-ink',
                )}
              >
                <span className="hidden sm:inline">{g}</span>
                <span className="sm:hidden">{num}</span>
              </button>
            )
          })}
        </div>

        <ArrowButton direction="next" label="Next grade" onClick={() => step(1)}>
          {/* Countdown ring — fills over INTERVAL_MS, then advances. */}
          <svg
            viewBox="0 0 44 44"
            aria-hidden
            className="pointer-events-none absolute inset-0 h-11 w-11 -rotate-90"
          >
            <circle cx="22" cy="22" r={RING_R} fill="none" strokeWidth="2.5" className="stroke-line-strong/60" />
            <circle
              ref={ringRef}
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              style={{ strokeDashoffset: RING_C }}
              className="stroke-primary transition-[stroke-dashoffset] duration-100 ease-linear"
            />
          </svg>
        </ArrowButton>
      </div>

      <div className="rounded-card border border-line bg-surface p-2 shadow-card sm:p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-label font-semibold text-muted">{activeGrade} · CAPS-aligned resources</span>
        </div>
        {covers.length ? (
          <div key={activeGrade} className="grid animate-fade-up grid-cols-2 gap-4 sm:grid-cols-4">
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
        <span className="font-semibold text-ink">Loved by 500+ families</span> across South Africa
      </div>
      <HeroShowcase snapshot={snapshot} />
    </Section>
  )
}
