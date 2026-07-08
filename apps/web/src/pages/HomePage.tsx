import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot, accessPlanTiers, publishedProducts } from '@designing-minds/cms'
import { GRADE_BLURB, WHY_FEATURES, gradeToSlug } from '../content/site'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Icon, type IconName } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Button } from '../components/ui/Button'
import { FaqAccordion } from '../components/ui/FaqAccordion'
import { ProductCover } from '../components/ProductCover'
import { StatsRow } from '../components/sections/StatsRow'
import { PricingSection } from '../components/sections/PricingSection'
import { CtaBanner } from '../components/sections/CtaBanner'

const FALLBACK_GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']

const GRADE_COLORWAYS = [
  'bg-butter text-amber',
  'bg-blossom text-magenta',
  'bg-meadow text-forest',
  'bg-periwinkle text-navy',
  'bg-lagoon text-teal',
]

function Stars() {
  return (
    <span className="text-[1rem] tracking-[1.5px] text-amber" aria-label="5 out of 5 stars">
      ★★★★★
    </span>
  )
}

function SectionNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
      <h3>{title}</h3>
      <p className="mx-auto mt-3 max-w-[560px] text-muted">{body}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Hero */

function HeroShowcase({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = useMemo(() => (snapshot?.valueLists.grades ?? FALLBACK_GRADES).slice(0, 5), [snapshot])
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
    <div className="mx-auto mt-12 max-w-[980px] lg:mt-14">
      {/* Subject tab switcher */}
      <div className="mb-6 flex items-center justify-center gap-4 sm:gap-3">
        <button
          type="button"
          aria-label="Previous subject"
          onClick={() => step(-1)}
          className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-soft transition-colors hover:text-ink"
        >
          <span className="h-4 w-4 rotate-180">
            <Icon name="arrow" />
          </span>
        </button>
        <div className="flex items-center justify-center gap-1 rounded-full border border-line bg-surface p-1 shadow-soft">
          {grades.map((g, i) => (
            <button
              key={g}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-full px-4 py-2 text-[0.9rem] font-semibold transition-colors ${
                i === active ? 'bg-primary text-white shadow-soft' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next subject"
          onClick={() => step(1)}
          className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-soft transition-colors hover:text-ink"
        >
          <span className="h-4 w-4">
            <Icon name="arrow" />
          </span>
        </button>
      </div>

      {/* Media frame */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="ml-2 text-[0.8rem] font-semibold text-muted">{activeGrade} · CAPS-aligned resources</span>
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

function HomeHero({ snapshot }: { snapshot: CmsSnapshot | null }) {
  return (
    <section className="bg-cream">
      <Container className="py-16 text-center lg:py-24">
        <Link
          to="/shop"
          className="inline-flex items-center gap-4 rounded-full border border-primary/20 bg-primary-tint px-4 py-1.5 text-[0.85rem] font-bold text-primary transition-colors hover:bg-primary/10"
        >
          New · Term 4 resources for Grades 3–7
          <span className="h-3.5 w-3.5">
            <Icon name="arrow" />
          </span>
        </Link>
        <h1 className="mx-auto mt-6 max-w-[15ch]">Practice resources that build confidence at home</h1>
        <p className="mx-auto mt-5 max-w-[580px] text-[1.05rem] leading-[1.55] text-ink-soft">
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
        <div className="mt-5 flex items-center justify-center gap-4 text-[0.9rem] text-ink-soft">
          <Stars />
          <span className="font-semibold text-ink">Loved by 70+ families</span> across South Africa
        </div>
        <HeroShowcase snapshot={snapshot} />
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------ Trust stats */

function HomeStatsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const stats = snapshot
    ? [
        { value: String(snapshot.stats.gradeCount), label: 'Grades supported' },
        { value: '70+', label: 'Families helped' },
        { value: String(snapshot.stats.productCount), label: 'Resources & bundles' },
        { value: String(snapshot.stats.subjectCount), label: 'Subjects covered' },
      ]
    : [
        { value: String(FALLBACK_GRADES.length), label: 'Grades supported' },
        { value: '70+', label: 'Families helped' },
        { value: '...', label: 'Resources & bundles' },
        { value: '...', label: 'Subjects covered' },
      ]

  return (
    <section className="section-tight">
      <Container>
        <p className="mb-8 text-center text-[0.95rem] font-medium text-muted">
          Trusted by families across South Africa
        </p>
        <StatsRow stats={stats} />
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Get to know */

const KNOW_ITEMS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'doc', title: 'Practice tests', body: 'Two CAPS-aligned tests per subject, each with a full memorandum for stress-free marking.' },
  { icon: 'book', title: 'Summaries & notes', body: 'Concise, curriculum-aligned summaries that help learners revise the key concepts fast.' },
  { icon: 'download', title: 'Instant download', body: 'Files unlock on your order page the moment payment succeeds — print as often as you like.' },
  { icon: 'spark', title: 'Term & year bundles', body: 'Group a grade’s resources into one discounted, once-off purchase — no subscriptions.' },
  { icon: 'shield', title: 'Your account', body: 'Every purchase is saved to your account, ready to re-download whenever you need it.' },
]

function GetToKnowSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <h2 className="max-w-[12ch]">Get to know Designing Minds</h2>
          <div>
            <p className="lead max-w-[46ch]">
              Replace scattered worksheets and past papers with one tidy library of CAPS-aligned resources built for
              South African classrooms.
            </p>
            <Button to="/about" variant="text" className="mt-3">
              See how it works
              <span className="h-4 w-4">
                <Icon name="arrow" />
              </span>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:items-center">
          <div>
            {KNOW_ITEMS.map((item, i) => {
              const isOpen = i === open
              return (
                <div key={item.title} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="flex w-full items-center gap-3.5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`grid h-10 w-10 flex-none place-items-center rounded-md transition-colors ${
                        isOpen ? 'bg-primary text-white' : 'bg-surface-sunk text-ink-soft'
                      }`}
                    >
                      <span className="h-5 w-5">
                        <Icon name={item.icon} />
                      </span>
                    </span>
                    <span className="flex-1 text-[1.08rem] font-bold">{item.title}</span>
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-line text-ink-soft">
                      <span className="h-3.5 w-3.5">
                        <Icon name="arrow" />
                      </span>
                    </span>
                  </button>
                  {isOpen ? <p className="pb-5 pl-[54px] pr-4 text-[0.96rem] text-muted">{item.body}</p> : null}
                </div>
              )
            })}
          </div>
          <div className="rounded-2xl border border-line bg-primary-tint/50 p-5 shadow-soft">
            <Placeholder ratio="4 / 3" className="bg-surface" />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Testimonials */

const FALLBACK_TESTIMONIALS = [
  {
    id: 'ft1',
    quote: 'The tests match exactly what my daughter covers in class. Marking is effortless with the memos included.',
    customerName: 'Thandi M.',
    context: 'Parent · Grade 5, Gauteng',
  },
  {
    id: 'ft2',
    quote: 'Instant download meant we could start practising the same evening. No more hunting for past papers.',
    customerName: 'Riaan van der Merwe',
    context: 'Parent · Grade 7, Western Cape',
  },
  {
    id: 'ft3',
    quote: 'Affordable and genuinely CAPS-aligned. My son walked into exams feeling ready.',
    customerName: 'Nomvula K.',
    context: 'Parent · Grade 4, KZN',
  },
  {
    id: 'ft4',
    quote: 'I use the bundles for my whole tutoring group. It saves me hours of prep every term.',
    customerName: 'Sarah P.',
    context: 'Tutor · Grades 3–6',
  },
]

function HomeTestimonials({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const published = snapshot?.testimonials.filter((t) => t.published) ?? []
  const items = published.length > 0 ? published : FALLBACK_TESTIMONIALS
  const lead = items[0]
  const cards = items.slice(1, 4)

  return (
    <section className="section bg-cream">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <Placeholder ratio="1 / 1" className="mx-auto max-w-[400px] bg-surface" label="Watch their story" />
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>What parents say</Eyebrow>
            <h2 className="max-w-[16ch]">Real stories from families across South Africa</h2>
            <blockquote className="mt-6 text-[clamp(1.3rem,2.2vw,1.6rem)] font-bold leading-[1.35] tracking-[-0.02em]">
              “{lead.quote}”
            </blockquote>
            <p className="mt-4 text-[0.98rem]">
              <strong className="font-bold">{lead.customerName}</strong>{' '}
              <span className="text-muted">· {lead.context}</span>
            </p>
          </div>
        </div>

        {cards.length > 0 ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {cards.map((t) => (
              <figure key={t.id} className="card flex flex-col gap-3 p-6">
                <div className="text-[0.95rem] tracking-[2px] text-amber">★★★★★</div>
                <blockquote className="text-[0.98rem] leading-[1.5]">“{t.quote}”</blockquote>
                <figcaption className="mt-auto text-[0.9rem]">
                  <strong className="font-bold">{t.customerName}</strong>{' '}
                  <span className="text-muted">· {t.context}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Feature bento */

function ChipRow() {
  const subs = ['Mathematics', 'English', 'Natural Science', 'Life Skills', 'Afrikaans', 'History']
  return (
    <div className="flex flex-wrap gap-4">
      {subs.map((s) => (
        <span key={s} className="rounded-full bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft shadow-soft">
          {s}
        </span>
      ))}
    </div>
  )
}

function MemoRows() {
  return (
    <div className="grid gap-4">
      {['Question 1 — 5 marks', 'Question 2 — 8 marks', 'Question 3 — 12 marks'].map((r) => (
        <div key={r} className="flex items-center gap-4.5 rounded-lg bg-surface px-3 py-2 text-[0.85rem] shadow-soft">
          <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-meadow text-forest">
            <span className="h-3 w-3">
              <Icon name="check" />
            </span>
          </span>
          {r}
        </div>
      ))}
    </div>
  )
}

function DownloadRows() {
  return (
    <div className="grid gap-4">
      {['Grade 5 Maths — Term 4.pdf', 'Memorandum.pdf'].map((r) => (
        <div key={r} className="flex items-center justify-between gap-4 rounded-lg bg-surface px-3 py-2 text-[0.85rem] shadow-soft">
          <span className="flex items-center gap-4 truncate">
            <span className="h-4 w-4 flex-none text-primary">
              <Icon name="doc" />
            </span>
            <span className="truncate">{r}</span>
          </span>
          <span className="h-4 w-4 flex-none text-primary">
            <Icon name="download" />
          </span>
        </div>
      ))}
    </div>
  )
}

function GrowthChart() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4">
      <svg viewBox="0 0 600 170" className="h-auto w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b57e8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4b57e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,158 C160,150 300,120 440,66 S600,14 600,14 L600,170 L0,170 Z" fill="url(#growth)" />
        <path d="M0,158 C160,150 300,120 440,66 S600,14 600,14" fill="none" stroke="#4b57e8" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-[0.75rem] font-bold text-white">
        Confidence, week by week
      </span>
    </div>
  )
}

function BentoCard({
  wide,
  title,
  body,
  tone,
  icon,
  children,
}: {
  wide?: boolean
  title: string
  body: string
  tone: string
  icon: IconName
  children: ReactNode
}) {
  return (
    <article
      className={`flex flex-col gap-6 rounded-lg border border-line bg-surface p-7 shadow-soft ${
        wide ? 'lg:col-span-2 lg:flex-row lg:items-center lg:gap-8' : ''
      }`}
    >
      <div className={wide ? 'lg:w-1/2' : ''}>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
          <span className="h-6 w-6">
            <Icon name={icon} />
          </span>
        </span>
        <h4 className="mt-4">{title}</h4>
        <p className="mt-2 text-[0.95rem] text-muted">{body}</p>
      </div>
      <div className={wide ? 'lg:w-1/2' : 'mt-auto'}>{children}</div>
    </article>
  )
}

function FeatureBento() {
  return (
    <section className="section bg-surface-alt">
      <Container>
        <div className="mx-auto mb-10 max-w-[680px] text-center lg:mb-14">
          <div className="flex justify-center">
            <Eyebrow>Why families choose us</Eyebrow>
          </div>
          <h2>Everything you need for the school term</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <BentoCard wide tone="bg-butter text-amber" icon="doc" title={WHY_FEATURES[0].title} body={WHY_FEATURES[0].body}>
            <ChipRow />
          </BentoCard>
          <BentoCard tone="bg-blossom text-magenta" icon="check" title={WHY_FEATURES[1].title} body={WHY_FEATURES[1].body}>
            <MemoRows />
          </BentoCard>
          <BentoCard tone="bg-lagoon text-teal" icon="download" title={WHY_FEATURES[2].title} body={WHY_FEATURES[2].body}>
            <DownloadRows />
          </BentoCard>
          <BentoCard wide tone="bg-periwinkle text-navy" icon="spark" title={WHY_FEATURES[3].title} body={WHY_FEATURES[3].body}>
            <GrowthChart />
          </BentoCard>
        </div>
      </Container>
    </section>
  )
}

/* --------------------------------------------------------- Grade finder */

function GradeFinderSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? FALLBACK_GRADES
  return (
    <section className="section">
      <Container>
        <div className="mb-10 grid gap-6 lg:mb-12 lg:grid-cols-2 lg:items-end">
          <h2 className="max-w-[14ch]">A resource set for every grade</h2>
          <p className="lead max-w-[46ch]">
            CAPS-aligned tests, memos and summaries for Grades 3 to 7 — pick your child’s grade to start.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade, index) => {
            const cw = GRADE_COLORWAYS[index % GRADE_COLORWAYS.length]
            const number = grade.replace(/[^0-9]/g, '') || grade
            return (
              <Link
                key={grade}
                to={`/grades/${gradeToSlug(grade)}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-soft transition-shadow hover:shadow-card"
              >
                <div className={`relative flex aspect-[16/10] items-center justify-center ${cw}`}>
                  <span className="text-[4rem] font-extrabold leading-none tracking-[-0.04em]">{number}</span>
                  <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-ink transition-transform group-hover:translate-x-0.5">
                    <span className="h-4 w-4">
                      <Icon name="arrow" />
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-[1.4rem]">{grade}</h3>
                  <p className="mt-1 text-[0.92rem] text-muted line-clamp-2">
                    {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------- Pricing */

function AccessPlansSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (snapshot) return <PricingSection tiers={accessPlanTiers(snapshot)} />
  return (
    <section className="section">
      <Container>
        <SectionNotice
          title={loadError ? 'Access plans are unavailable' : 'Loading access plans...'}
          body={loadError ?? 'The rest of the page is ready while we fetch the latest plan details.'}
        />
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------ How it works */

const STEPS: { when: string; title: string; items: string[]; highlight?: boolean }[] = [
  {
    when: 'Today',
    title: 'Buy & download',
    items: ['Choose your grade and term', 'Pay securely by card', 'Download instantly on your order page'],
    highlight: true,
  },
  {
    when: 'This week',
    title: 'Print & practise',
    items: ['Print at home, as often as you like', 'Work through CAPS-aligned tests', 'Mark with the included memo'],
  },
  {
    when: 'By term-end',
    title: 'Exam-ready',
    items: ['Revise with concise summaries', 'Build confidence before exams', 'Re-download anytime from your account'],
  },
]

function HowItWorksSection() {
  return (
    <section className="section bg-cream">
      <Container>
        <div className="mx-auto mb-10 max-w-[680px] text-center lg:mb-14">
          <div className="flex justify-center">
            <Eyebrow>How it works</Eyebrow>
          </div>
          <h2>From cart to classroom in minutes</h2>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card lg:p-10">
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className={`rounded-xl p-5 ${s.highlight ? 'bg-primary-tint' : ''}`}>
                <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">{s.when}</p>
                <h4 className="mt-1">{s.title}</h4>
                <ul className="mt-3 grid gap-4 text-[0.95rem] text-ink-soft">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-4.5">
                      <span className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-primary text-white">
                        <span className="h-2.5 w-2.5">
                          <Icon name="check" />
                        </span>
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <GrowthChart />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Bundle CTA */

function BundleCtaSection() {
  return (
    <section className="section">
      <Container>
        <CtaBanner
          eyebrow="Bundles & access plans"
          title="Cover a whole term or the full year in one purchase"
          body="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a term or year — no auto-renewal."
        >
          <Button to="/packages" variant="solid-light">
            Browse bundles &amp; plans
          </Button>
          <Button to="/about" variant="outline-light">
            Learn more
          </Button>
        </CtaBanner>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------- FAQ */

function HomeFaqSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const homeFaqs = snapshot?.faqs.filter((f) => f.published).slice(0, 5) ?? []
  return (
    <section className="section bg-surface-alt">
      <Container>
        <div className="mx-auto max-w-[820px]">
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <Eyebrow>FAQ</Eyebrow>
            </div>
            <h2>Common questions</h2>
          </div>
          {snapshot ? (
            <FaqAccordion faqs={homeFaqs} />
          ) : (
            <SectionNotice
              title={loadError ? 'Help topics are unavailable' : 'Loading help topics...'}
              body={loadError ?? 'Frequently asked questions will appear here when the content request finishes.'}
            />
          )}
          <div className="mt-6 text-center">
            <Button to="/help" variant="text">
              See all help topics
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------- Final CTA */

function FinalCtaSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? FALLBACK_GRADES
  return (
    <section className="section">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 text-center shadow-card lg:p-16">
          <span aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-butter/50" />
          <span aria-hidden className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-lagoon/50" />
          <div className="relative">
            <h2 className="mx-auto max-w-[18ch]">Ready to help your child practise?</h2>
            <p className="mx-auto mt-4 max-w-[520px] lead">
              Pick your child’s grade to browse CAPS-aligned resources — or grab a term bundle and save.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4.5">
              {grades.map((grade) => (
                <Link
                  key={grade}
                  to={`/grades/${gradeToSlug(grade)}`}
                  className="rounded-full border border-line-strong bg-surface px-5 py-2.5 text-[0.95rem] font-bold transition-colors hover:border-primary hover:text-primary"
                >
                  {grade}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/shop" variant="solid">
                Browse all resources
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Button>
              <Button to="/packages" variant="soft">
                See bundles &amp; plans
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------- Homepage */

export function HomePage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  return (
    <>
      <HomeHero snapshot={snapshot} />
      <HomeStatsSection snapshot={snapshot} />
      <GetToKnowSection />
      <HomeTestimonials snapshot={snapshot} />
      <FeatureBento />
      <GradeFinderSection snapshot={snapshot} />
      <AccessPlansSection snapshot={snapshot} loadError={loadError} />
      <HowItWorksSection />
      <BundleCtaSection />
      <HomeFaqSection snapshot={snapshot} loadError={loadError} />
      <FinalCtaSection snapshot={snapshot} />
    </>
  )
}
