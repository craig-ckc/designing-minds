import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import {
  createCmsRepository,
  defaultProductFilters,
  filterProducts,
  formatCurrency,
  getPageBySlug,
  getProductBySlug,
  toParagraphs,
  type CmsProduct,
  type CmsSnapshot,
  type ProductFilterState,
} from '@designing-minds/cms'

const repository = createCmsRepository({
  app: 'web',
  provider: import.meta.env.VITE_CMS_PROVIDER,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

/* -------------------------------------------------------------------------
   Static content sourced from the extracted designingminds.co.za research.
   ------------------------------------------------------------------------- */

const PROOF_POINTS = ['Teacher-led', 'CAPS aligned', 'Grades 3–7', 'Printable PDFs', 'Instant download']

const PLANS = [
  {
    name: 'Essential Access',
    price: 'R350',
    cadence: 'per term',
    featured: false,
    cta: 'Buy Term Access',
    features: [
      'Includes 2 CAPS-aligned tests per subject',
      'Covers all core subjects for your selected grade',
      'Memo included with every test',
      'Ideal for short-term use or new learners',
    ],
  },
  {
    name: 'Premium Access',
    price: 'R1,200',
    cadence: 'per year',
    featured: true,
    cta: 'Purchase Full Access',
    features: [
      'Access every subject and every term',
      'Automatic delivery each term via email',
      'Priority updates and new test releases',
      'One simple subscription, no reordering needed',
    ],
  },
]

const WHY_FEATURES = [
  {
    title: 'CAPS-Aligned Curriculum',
    body: 'All tests are aligned to the latest CAPS Annual Teaching Plan for each grade.',
  },
  {
    title: 'Memorandums Included',
    body: 'Every test includes a clear, easy-to-use memorandum for stress-free marking.',
  },
  {
    title: 'Instant Download & Access',
    body: 'Get immediate access after purchase. Download once and print anytime.',
  },
  {
    title: 'Builds Exam Confidence',
    body: 'Structured practice helps learners feel prepared and confident in assessments.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Amoré',
    meta: 'Parent · 7 days ago',
    quote: 'My son’s Afrikaans mark improved from 42% to 84%! Thank you.',
  },
  {
    name: 'Lizaan',
    meta: 'Parent · Afrikaans HL',
    quote: 'Ek het verlede kwartaal al julle goedjies gekoop … dit maak dit soveel makliker.',
  },
]

const FAQS = [
  {
    q: 'What grades are your tests available for?',
    a: 'We currently offer printable CAPS-aligned tests for Grades 3 to 7, covering all major subjects. Each term, new tests are released so your child can keep practicing with up-to-date material.',
  },
  {
    q: 'Are your tests aligned with the South African CAPS curriculum?',
    a: 'Yes, every single test is 100% CAPS-aligned and created by qualified teachers. They follow the same structure, layout, and expectations your child will encounter in the classroom.',
  },
  {
    q: 'How do I receive the tests after purchase?',
    a: 'Once your payment is complete, your tests are instantly available for download in PDF format. You’ll also receive a confirmation email with download links so you can access them anytime.',
  },
  {
    q: 'What’s the difference between Term Access and the Annual Subscription?',
    a: 'Term Access (Essential) is paid once per term (R350) for your selected grade and term only. The Annual Subscription (Premium) is one yearly payment (R1,200) for all grades, all subjects, and all terms — automatically delivered each term, with over R200 in savings.',
  },
  {
    q: 'Can I use the same tests for more than one child?',
    a: 'Yes — once you’ve purchased the tests, you’re free to print and reuse them within your household. If you’re a teacher or tutor, please contact us for multi-user or classroom licensing.',
  },
  {
    q: 'Can I print the tests from my phone or tablet?',
    a: 'Yes — all tests are PDF files, so you can download and print them from any device with a printer connection.',
  },
]

const CONTACT = {
  phone: '+27 84 605 5217',
  email: 'designingminds123@gmail.com',
  location: 'Port Elizabeth, South Africa',
}

const GRADE_BLURB: Record<string, string> = {
  'Grade 3': 'Foundation-phase practice that builds early confidence.',
  'Grade 4': 'Intermediate-phase tests across all core subjects.',
  'Grade 5': 'Term-by-term assessments aligned to the CAPS plan.',
  'Grade 6': 'Exam-style practice to prepare for senior phase.',
  'Grade 7': 'Senior-phase tests and full-year bundles.',
}

/* -------------------------------------------------------------------------
   Shared Tailwind class strings
   ------------------------------------------------------------------------- */

const SECTION = 'py-14 sm:py-20 lg:py-28'
const SECTION_TIGHT = 'py-10 sm:py-12 lg:py-16'
const LEAD = 'text-[clamp(1.05rem,1.6vw,1.2rem)] text-ink-soft'
const CARD = 'rounded-[10px] border border-line bg-surface'
const FIELD =
  'w-full min-h-[46px] rounded-md border border-line-strong bg-surface px-3.5 py-2.5 focus:outline focus:outline-2 focus:outline-ink focus:-outline-offset-1'

function btn(variant: 'solid' | 'ghost' | 'light' | 'outline-light' = 'solid', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md min-h-[46px] px-[22px] text-[0.97rem] font-medium border-[1.5px] transition whitespace-nowrap'
  const variants = {
    solid: 'bg-ink text-white border-ink hover:opacity-85',
    ghost: 'bg-transparent text-ink border-ink hover:bg-ink hover:text-white',
    light: 'bg-white text-ink border-white hover:opacity-90',
    'outline-light': 'bg-transparent text-white border-white/40 hover:bg-white hover:text-ink',
  }[variant]
  return `${base} ${variants} ${extra}`
}

/* -------------------------------------------------------------------------
   Primitive components
   ------------------------------------------------------------------------- */

function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-16 ${className}`}>{children}</div>
}

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-4 inline-block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </p>
  )
}

function Icon({ name }: { name: 'check' | 'arrow' | 'cart' | 'doc' | 'star' | 'shield' | 'download' | 'spark' | 'plus' }) {
  const paths: Record<string, ReactNode> = {
    check: <path d="M20 6 9 17l-5-5" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    cart: (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </>
    ),
    doc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </>
    ),
    star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
    spark: <path d="M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3" />,
    plus: <path d="M12 5v14M5 12h14" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

const FEATURE_ICONS = ['doc', 'shield', 'download', 'spark'] as const

/* The signature Relume placeholder image block. */
function Placeholder({
  ratio,
  label,
  circle,
  className = '',
}: {
  ratio?: string
  label?: string
  circle?: boolean
  className?: string
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-ph text-ph-glyph ${
        circle ? 'rounded-full' : 'rounded-[10px]'
      } ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden="true"
    >
      <svg className="h-11 w-11 opacity-90" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="9" width="36" height="30" rx="3" />
        <circle cx="17" cy="19" r="3.5" />
        <path d="M9 35l10-9 7 6 6-5 7 6" />
      </svg>
      {label ? (
        <span className="absolute bottom-3 left-3 text-[0.72rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------
   App + shell
   ------------------------------------------------------------------------- */

function App() {
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const nextSnapshot = await repository.getSnapshot()
        if (!cancelled) {
          setSnapshot(nextSnapshot)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load content.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Shell snapshot={null}>
        <StatePanel eyebrow="Something went wrong" title="Website unavailable" body={error} />
      </Shell>
    )
  }

  if (!snapshot) {
    return (
      <Shell snapshot={null}>
        <StatePanel eyebrow="Loading" title="Preparing the catalogue…" />
      </Shell>
    )
  }

  return (
    <Shell snapshot={snapshot}>
      <Routes>
        <Route path="/" element={<HomeRoute snapshot={snapshot} />} />
        <Route path="/shop" element={<ShopRoute snapshot={snapshot} />} />
        <Route path="/product/:slug" element={<ProductRoute snapshot={snapshot} />} />
        <Route path="/about" element={<AboutRoute snapshot={snapshot} />} />
        <Route path="/about-3" element={<AboutRoute snapshot={snapshot} />} />
        <Route path="/contact" element={<ContactRoute />} />
        <Route path="/:slug" element={<PageRoute snapshot={snapshot} />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </Shell>
  )
}

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function Shell({ children, snapshot }: { children: ReactNode; snapshot: CmsSnapshot | null }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <Container className="flex min-h-[72px] items-center gap-7">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
              DM
            </span>
            <span className="leading-tight">
              <span className="block text-[1.05rem] tracking-[-0.02em]">Designing Minds</span>
              <span className="block text-[0.68rem] font-normal tracking-[0.04em] text-muted">
                CAPS-aligned assessments
              </span>
            </span>
          </Link>

          <nav className="ml-3 hidden gap-1 md:flex">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-[0.95rem] hover:bg-surface-alt hover:text-ink ${
                    isActive ? 'font-medium text-ink' : 'text-ink-soft'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-line-strong px-3 py-2 text-[0.9rem] sm:inline-flex">
              <span className="h-4 w-4">
                <Icon name="cart" />
              </span>
              Cart (0)
            </span>
            <Link to="/shop" className={btn('solid', 'min-h-[38px] px-4 text-[0.9rem]')}>
              Browse Tests
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <SiteFooter snapshot={snapshot} />
    </>
  )
}

function SiteFooter({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.filters.grades ?? []
  return (
    <footer className="mt-auto border-t border-line bg-surface-alt">
      <Container className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-[72px]">
        <div>
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
              DM
            </span>
            <span className="text-[1.05rem] tracking-[-0.02em]">Designing Minds</span>
          </Link>
          <p className="mt-3.5 max-w-[34ch] text-[0.95rem] text-muted">
            Affordable, CAPS-aligned printable tests that help learners across South Africa prepare with confidence.
          </p>
          <NewsletterForm compact />
        </div>

        <FooterColumn title="Shop by grade">
          {grades.map((grade) => (
            <li key={grade}>
              <Link className="text-[0.95rem] text-ink-soft hover:text-ink" to={`/shop?grade=${encodeURIComponent(grade)}`}>
                {grade}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink to="/about">About</FooterLink>
          <FooterLink to="/contact">Contact</FooterLink>
          <FooterLink to="/shop">All tests</FooterLink>
          <FooterLink to="/privacy-policy">Privacy policy</FooterLink>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <li>
            <a className="text-[0.95rem] text-ink-soft hover:text-ink" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
              {CONTACT.phone}
            </a>
          </li>
          <li>
            <a className="text-[0.95rem] text-ink-soft hover:text-ink" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </li>
          <li className="text-[0.95rem] text-muted">{CONTACT.location}</li>
        </FooterColumn>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-5.5 text-[0.88rem] text-muted">
        <span>© 2026 Designing Minds. All rights reserved.</span>
        <span>Wireframe preview · Provider: {repository.mode}</span>
      </Container>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h5>
      <ul className="grid gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link className="text-[0.95rem] text-ink-soft hover:text-ink" to={to}>
        {children}
      </Link>
    </li>
  )
}

/* -------------------------------------------------------------------------
   Home
   ------------------------------------------------------------------------- */

function HomeRoute({ snapshot }: { snapshot: CmsSnapshot }) {
  const featured = useMemo(() => getFeatured(snapshot, 6), [snapshot])
  const stats = [
    { value: String(snapshot.stats.gradeCount), label: 'Grades supported' },
    { value: '70+', label: 'Families helped' },
    { value: String(snapshot.stats.productCount), label: 'Tests & bundles' },
    { value: String(snapshot.stats.subjectCount), label: 'Subjects covered' },
  ]

  return (
    <>
      {/* Hero */}
      <section className={SECTION}>
        <Container className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
          <div>
            <Eyebrow>Printable · CAPS-aligned · Grades 3–7</Eyebrow>
            <h1>{snapshot.spotlight.headline}</h1>
            <p className={`mt-5 ${LEAD}`}>
              Support your child’s learning at home with high-quality, CAPS-aligned practice materials — crafted by
              teachers, tested by parents, and loved by learners across South Africa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className={btn('solid')}>
                Browse Tests
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Link>
              <a href="#plans" className={btn('ghost')}>
                Compare plans
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {PROOF_POINTS.map((point) => (
                <Tag key={point}>{point}</Tag>
              ))}
            </div>
          </div>
          <Placeholder label="Hero illustration" ratio="4 / 3.4" />
        </Container>
      </section>

      {/* Stats */}
      <section className={`${SECTION_TIGHT} bg-surface-alt`}>
        <Container>
          <StatsRow stats={stats} />
        </Container>
      </section>

      {/* Grade finder */}
      <section className={SECTION}>
        <Container>
          <div className="mb-9 max-w-[640px] lg:mb-14">
            <Eyebrow>Find by grade</Eyebrow>
            <h2>Find resources for your child’s grade</h2>
            <p className={`mt-4 ${LEAD}`}>
              Explore CAPS-aligned printable tests and learning resources for Grades 3 to 7.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {snapshot.filters.grades.map((grade) => (
              <Link
                key={grade}
                to={`/shop?grade=${encodeURIComponent(grade)}`}
                className="group flex flex-col gap-3.5 rounded-[10px] border border-line bg-surface p-5.5 transition hover:-translate-y-0.5 hover:border-ink"
              >
                <Placeholder label={grade} ratio="5 / 3" />
                <span className="text-[1.25rem] font-semibold">{grade}</span>
                <p className="text-muted">{GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}</p>
                <span className="mt-auto text-[0.88rem] text-muted">Browse tests →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Featured tests */}
      <section className={`${SECTION} bg-surface-alt`}>
        <Container>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6 lg:mb-11">
            <div className="max-w-[640px]">
              <Eyebrow>Featured tests</Eyebrow>
              <h2>Latest CAPS-aligned resources</h2>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-1.5 border-b-[1.5px] border-current pb-0.5 font-medium hover:opacity-70">
              View full catalogue
              <span className="h-4 w-4">
                <Icon name="arrow" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      {/* Why parents love us */}
      <section className={SECTION}>
        <Container>
          <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
            <Eyebrow>Why parents love Designing Minds</Eyebrow>
            <h2>Learning made simple, affordable, and confidence-boosting</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_FEATURES.map((feature, index) => (
              <article key={feature.title}>
                <span className="mb-[18px] grid h-12 w-12 place-items-center rounded-[10px] bg-surface-sunk text-ink-soft">
                  <span className="h-6 w-6">
                    <Icon name={FEATURE_ICONS[index] ?? 'doc'} />
                  </span>
                </span>
                <h4 className="mb-2">{feature.title}</h4>
                <p className="text-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Full-year bundle CTA */}
      <section className={SECTION}>
        <Container>
          <CtaBanner
            eyebrow="Full year access · R1,200 once-off"
            title="Everything your child needs for the full school year"
            body="Give your child every CAPS-aligned test for their grade with our Full Year Test Bundles for Grades 4 to 7 — automatically delivered each term."
          >
            <Link to="/shop" className={btn('light')}>
              Get Full Year Access
            </Link>
            <Link to="/about" className={btn('outline-light')}>
              Learn more
            </Link>
          </CtaBanner>
        </Container>
      </section>

      {/* Newsletter */}
      <section className={`${SECTION_TIGHT} bg-surface-alt`}>
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <Eyebrow>Free test</Eyebrow>
            <h2>Get a free test when you subscribe</h2>
            <p className={`mt-4 ${LEAD}`}>
              Subscribe to our mailing list and receive a free CAPS-aligned practice test, plus new releases and learning
              tips straight to your inbox.
            </p>
            <div className="mt-6 flex justify-center">
              <NewsletterForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

function PricingSection() {
  return (
    <section className={SECTION} id="plans">
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>Plans</Eyebrow>
          <h2>Choose the best learning plan for your child</h2>
          <p className={`mt-4 ${LEAD}`}>Pay per term, or unlock everything for the year with over R200 in savings.</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col gap-5.5 rounded-[10px] bg-surface p-8 ${
                plan.featured ? 'border-2 border-ink' : 'border border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3>{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="text-[2.6rem] font-semibold tracking-[-0.03em]">{plan.price}</strong>
                    <span className="text-muted">{plan.cadence}</span>
                  </div>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-ink px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.08em] text-white">
                    Best value
                  </span>
                ) : null}
              </div>
              <ul className="grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[0.95rem] text-ink-soft">
                    <span className="mt-0.5 h-[18px] w-[18px] flex-none text-ink">
                      <Icon name="check" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/shop" className={btn(plan.featured ? 'solid' : 'ghost', 'w-full')}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className={`${SECTION} bg-surface-alt`}>
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>What parents are saying</Eyebrow>
          <h2>Real stories from families across South Africa</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className={`flex flex-col gap-5 p-[30px] ${CARD}`}>
              <div className="tracking-[3px] text-ink" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote className="text-[1.12rem] leading-[1.5]">“{item.quote}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <Placeholder circle className="h-11 w-11 flex-none" />
                <span>
                  <strong className="block text-[0.95rem] font-semibold">{item.name}</strong>
                  <span className="text-[0.85rem] text-muted">{item.meta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------------
   Shop
   ------------------------------------------------------------------------- */

function ShopRoute({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    ...defaultProductFilters,
    grade: searchParams.get('grade') ?? defaultProductFilters.grade,
    subject: searchParams.get('subject') ?? defaultProductFilters.subject,
  }))

  const deferredQuery = useDeferredValue(filters.query)
  const visibleProducts = filterProducts(snapshot.products, { ...filters, query: deferredQuery })

  const updateFilter = (patch: Partial<ProductFilterState>) => {
    setFilters((current) => {
      const next = { ...current, ...patch }
      const params = new URLSearchParams()
      if (next.grade !== defaultProductFilters.grade) params.set('grade', next.grade)
      if (next.subject !== defaultProductFilters.subject) params.set('subject', next.subject)
      setSearchParams(params, { replace: true })
      return next
    })
  }

  const resetFilters = () => {
    setFilters(defaultProductFilters)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <section className={`${SECTION_TIGHT} bg-surface-alt`}>
        <Container>
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Shop" />
          <div className="max-w-[640px]">
            <Eyebrow>Catalogue</Eyebrow>
            <h1>All tests &amp; bundles</h1>
            <p className={`mt-4 ${LEAD}`}>
              Browse {snapshot.stats.productCount} CAPS-aligned resources across grades, terms, subjects, and formats.
            </p>
          </div>
        </Container>
      </section>

      <section className={SECTION}>
        <Container className="grid items-start gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="grid gap-[18px] rounded-[10px] border border-line p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h4>Filters</h4>
              <button type="button" onClick={resetFilters} className="text-[0.85rem] font-medium underline underline-offset-2 hover:opacity-70">
                Reset
              </button>
            </div>
            <Field label="Search">
              <input
                className={FIELD}
                value={filters.query}
                onChange={(event) => updateFilter({ query: event.target.value })}
                placeholder="e.g. Grade 5 maths"
              />
            </Field>
            <SelectField
              label="Grade"
              value={filters.grade}
              options={['All grades', ...snapshot.filters.grades]}
              onChange={(value) => updateFilter({ grade: value })}
            />
            <SelectField
              label="Term"
              value={filters.term}
              options={['All terms', ...snapshot.filters.terms]}
              onChange={(value) => updateFilter({ term: value })}
            />
            <SelectField
              label="Subject"
              value={filters.subject}
              options={['All subjects', ...snapshot.filters.subjects]}
              onChange={(value) => updateFilter({ subject: value })}
            />
            <SelectField
              label="Format"
              value={filters.type}
              options={['All formats', ...snapshot.filters.productTypes]}
              onChange={(value) => updateFilter({ type: value })}
            />
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h4>{visibleProducts.length} results</h4>
              <span className="text-muted">Sorted by most recent</span>
            </div>
            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={`p-7 text-center ${CARD}`}>
                <h4>No matching resources</h4>
                <p className="mt-2 text-muted">Try clearing a filter or searching for a different grade or subject.</p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}

/* -------------------------------------------------------------------------
   Product detail
   ------------------------------------------------------------------------- */

function ProductRoute({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const product = slug ? getProductBySlug(snapshot, slug) : undefined

  if (!product) {
    return <NotFoundRoute />
  }

  const related = snapshot.products
    .filter((entry) => entry.id !== product.id && entry.grade === product.grade)
    .slice(0, 3)

  return (
    <>
      <section className={SECTION}>
        <Container>
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
            ]}
            current={product.grade}
          />

          <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <Placeholder label="Sample preview" ratio="4 / 3.2" />
              <div className="mt-8 grid gap-4 text-ink-soft">
                <h3>About this resource</h3>
                {product.excerpt ? <p className="text-[1.02rem]">{product.excerpt}</p> : null}
                <BodyCopy body={product.body} />
              </div>
            </div>

            <aside className="grid gap-[18px] rounded-[10px] border border-line p-7 lg:sticky lg:top-24">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">
                {product.grade} · {product.term}
              </p>
              <h1 className="text-[1.7rem]">{product.title}</h1>
              <div className="text-[2.4rem] font-semibold tracking-[-0.03em]">{formatCurrency(product.priceZar)}</div>
              <ul className="grid gap-3">
                <SpecRow label="Grade" value={product.grade} />
                <SpecRow label="Term" value={product.term} />
                <SpecRow label="Subject" value={product.primarySubject} />
                <SpecRow label="Format" value={product.type} />
                <SpecRow label="Marks" value={product.marks ? `${product.marks} marks` : 'Not listed'} />
                <SpecRow label="Delivery" value="Instant PDF download" last />
              </ul>
              <button type="button" className={btn('solid', 'w-full')}>
                <span className="h-4 w-4">
                  <Icon name="cart" />
                </span>
                Add to cart
              </button>
              <p className="text-[0.82rem] text-muted">CAPS-aligned · Memo included · Print at home</p>
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className={`${SECTION} bg-surface-alt`}>
          <Container>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h3>More {product.grade} resources</h3>
              <Link
                to={`/shop?grade=${encodeURIComponent(product.grade)}`}
                className="inline-flex items-center gap-1.5 border-b-[1.5px] border-current pb-0.5 font-medium hover:opacity-70"
              >
                See all
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <li className={`flex justify-between gap-3 text-[0.92rem] ${last ? '' : 'border-b border-line pb-3'}`}>
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </li>
  )
}

/* -------------------------------------------------------------------------
   About
   ------------------------------------------------------------------------- */

function AboutRoute({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <>
      <section className={SECTION}>
        <Container className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
          <div>
            <Eyebrow>About Designing Minds</Eyebrow>
            <h1>Shaping confident learners, one test at a time</h1>
            <p className={`mt-5 ${LEAD}`}>
              At Designing Minds, we believe learning should be simple, accessible, and stress-free. We create affordable,
              CAPS-aligned practice tests that help learners prepare for exams with confidence, while empowering parents to
              guide their children’s education at home.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {PROOF_POINTS.map((point) => (
                <Tag key={point}>{point}</Tag>
              ))}
            </div>
          </div>
          <Placeholder label="Founder portrait" ratio="4 / 3.4" />
        </Container>
      </section>

      <section className={`${SECTION_TIGHT} bg-surface-alt`}>
        <Container>
          <StatsRow
            stats={[
              { value: '70+', label: 'Families helped' },
              { value: String(snapshot.stats.gradeCount), label: 'Grades supported' },
              { value: String(snapshot.stats.productCount), label: 'Resources created' },
              { value: '100%', label: 'CAPS aligned' },
            ]}
          />
        </Container>
      </section>

      <section className={SECTION}>
        <Container className="grid justify-items-center">
          <div className="mb-9 max-w-[640px] text-center lg:mb-14">
            <Eyebrow>Our story</Eyebrow>
            <h2>Where a passion for teaching meets a heart for learners</h2>
          </div>
          <div className="grid max-w-[70ch] gap-4 text-ink-soft">
            <p className="text-[1.02rem]">
              Designing Minds was created from a simple idea: that every parent deserves easy access to quality learning
              resources that help their children feel confident and prepared.
            </p>
            <p className="text-[1.02rem]">
              We design affordable, CAPS-aligned printable tests that make studying stress-free, structured, and engaging.
              Our resources are crafted by teachers, tested by parents, and loved by learners across South Africa.
            </p>
            <p className="text-[1.02rem]">
              Each test is created to build confidence, reduce exam anxiety, and familiarise learners with real
              classroom-style questions — so they walk into every test ready to succeed.
            </p>
          </div>
        </Container>
      </section>

      <section className={`${SECTION} bg-surface-alt`}>
        <Container className="grid items-center gap-9 lg:grid-cols-[0.95fr_1.05fr] lg:gap-[72px]">
          <Placeholder label="Meet Amy" ratio="4 / 3.4" />
          <div>
            <Eyebrow>Meet Amy — Founder</Eyebrow>
            <h2>A teacher with a vision for stress-free learning</h2>
            <div className="mt-5 grid gap-4 text-ink-soft">
              <p className="text-[1.02rem]">
                Hi, I’m Amy. After teaching in Vietnam and working with online schools in South Africa, I discovered how
                powerful accessible learning tools can be. I combined my experience in curriculum development with my love
                for teaching to create Designing Minds — a platform dedicated to helping learners feel confident, prepared,
                and supported.
              </p>
              <p className="text-[1.02rem]">
                What excites me most is seeing how these resources not only improve marks, but also reduce stress and give
                learners belief in their own abilities.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <TestimonialsSection />

      <section className={SECTION}>
        <Container>
          <CtaBanner
            title="Ready to support your child’s learning journey?"
            body="Explore our printable CAPS-aligned tests and learning resources, made to build confidence, reduce stress, and make learning fun."
          >
            <Link to="/shop" className={btn('light')}>
              Browse Tests
            </Link>
          </CtaBanner>
        </Container>
      </section>
    </>
  )
}

/* -------------------------------------------------------------------------
   Contact
   ------------------------------------------------------------------------- */

function ContactRoute() {
  return (
    <>
      <section className={SECTION}>
        <Container>
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Contact" />
          <div className="grid items-start gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Eyebrow>Contact us</Eyebrow>
              <h1>Get in touch</h1>
              <p className={`mt-4 ${LEAD}`}>
                Questions about a test, a bundle, or classroom licensing? We’d love to help.
              </p>
              <div className="mt-7">
                <ContactDetail label="Phone" value={CONTACT.phone} />
                <ContactDetail label="Email" value={CONTACT.email} />
                <ContactDetail label="Office" value={CONTACT.location} last />
              </div>
            </div>

            <form className={`grid gap-[18px] p-7 ${CARD}`} onSubmit={(event) => event.preventDefault()}>
              <h3>Send us a message</h3>
              <Field label="Name">
                <input className={FIELD} placeholder="Your name" />
              </Field>
              <Field label="Email">
                <input className={FIELD} type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Message">
                <textarea className={`${FIELD} min-h-[130px] resize-y`} placeholder="How can we help?" />
              </Field>
              <button type="submit" className={btn('solid')}>
                Send message
              </button>
              <p className="text-[0.82rem] text-muted">We usually reply within one business day.</p>
            </form>
          </div>
        </Container>
      </section>

      <section className={`${SECTION} bg-surface-alt`}>
        <Container>
          <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
            <Eyebrow>FAQ</Eyebrow>
            <h2>Frequently asked questions</h2>
          </div>
          <FaqList />
        </Container>
      </section>
    </>
  )
}

function ContactDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`grid gap-1.5 py-[18px] ${last ? '' : 'border-b border-line'}`}>
      <span className="text-[0.82rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      <strong className="text-[1.1rem] font-medium">{value}</strong>
    </div>
  )
}

function FaqList() {
  return (
    <div className="mx-auto max-w-[820px] border-t border-line">
      {FAQS.map((item, index) => (
        <details key={item.q} open={index === 0} className="group border-b border-line">
          <summary className="flex items-center justify-between gap-4 px-2 py-[22px] text-[1.05rem] font-medium">
            {item.q}
            <span className="h-[22px] w-[22px] flex-none text-ink transition-transform group-open:rotate-45">
              <Icon name="plus" />
            </span>
          </summary>
          <div className="max-w-[70ch] px-2 pb-6 text-ink-soft">{item.a}</div>
        </details>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Generic CMS page + 404
   ------------------------------------------------------------------------- */

function PageRoute({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const page = slug ? getPageBySlug(snapshot, slug) : undefined

  if (!page) {
    return <NotFoundRoute />
  }

  return (
    <section className={SECTION}>
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current={page.title} />
        <div className="mb-9 max-w-[640px]">
          <Eyebrow>Page</Eyebrow>
          <h1>{page.title}</h1>
          {page.summary ? <p className={`mt-4 ${LEAD}`}>{page.summary}</p> : null}
        </div>
        <div className="grid max-w-[70ch] gap-4 text-ink-soft">
          <BodyCopy body={page.body} />
        </div>
      </Container>
    </section>
  )
}

function NotFoundRoute() {
  return (
    <StatePanel eyebrow="404" title="Page not found" body="This route doesn’t match anything in the catalogue.">
      <div className="mt-2 flex justify-center">
        <Link to="/" className={btn('solid')}>
          Back to home
        </Link>
      </div>
    </StatePanel>
  )
}

/* -------------------------------------------------------------------------
   Shared pieces
   ------------------------------------------------------------------------- */

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[0.82rem] text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-ink" />
      {children}
    </span>
  )
}

function StatsRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface px-6 py-7">
          <strong className="block text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold tracking-[-0.03em]">
            {stat.value}
          </strong>
          <span className="text-[0.92rem] text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

function CtaBanner({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <div className="grid items-center gap-8 rounded-[10px] bg-ink p-9 text-white lg:grid-cols-[1.4fr_1fr] lg:p-16">
      <div>
        {eyebrow ? (
          <p className="mb-4 inline-block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white/60">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-white">{title}</h2>
        <p className="mt-3.5 text-white/70">{body}</p>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">{children}</div>
    </div>
  )
}

function Breadcrumb({ trail, current }: { trail: { to: string; label: string }[]; current: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-[0.88rem] text-muted">
      {trail.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-2">
          <Link to={crumb.to} className="hover:text-ink">
            {crumb.label}
          </Link>
          <span className="text-line-strong">/</span>
        </span>
      ))}
      <span>{current}</span>
    </div>
  )
}

function ProductCard({ product }: { product: CmsProduct }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-[10px] border border-line bg-surface transition hover:-translate-y-0.5 hover:border-ink"
    >
      <Placeholder ratio="4 / 3" className="rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <div className="flex flex-wrap gap-2">
          <Chip>{product.grade}</Chip>
          <Chip>{product.term}</Chip>
        </div>
        <h4 className="text-[1.02rem] leading-snug">{product.title}</h4>
        <p className="flex-1 text-[0.88rem] text-muted">{product.excerpt || product.primarySubject}</p>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-semibold">{product.priceLabel}</span>
          <span className="inline-flex items-center gap-1 text-[0.9rem] underline underline-offset-2">
            View
            <span className="h-4 w-4">
              <Icon name="arrow" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.04em] text-muted">
      {children}
    </span>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-[0.92rem] font-medium">
      {label}
      {children}
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <select className={FIELD} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  )
}

function NewsletterForm({ compact }: { compact?: boolean }) {
  return (
    <form
      className={`flex max-w-[460px] flex-col gap-2.5 sm:flex-row ${compact ? 'mt-[18px]' : 'mt-6'}`}
      onSubmit={(event) => event.preventDefault()}
    >
      <input className={`${FIELD} flex-1`} type="email" placeholder="Enter your email" aria-label="Email address" />
      <button type="submit" className={btn('solid')}>
        {compact ? 'Subscribe' : 'Get my free test'}
      </button>
    </form>
  )
}

function StatePanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div className="grid max-w-[460px] gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {body ? <p className={LEAD}>{body}</p> : null}
        {children}
      </div>
    </div>
  )
}

function BodyCopy({ body }: { body: string }) {
  const paragraphs = toParagraphs(body).filter((paragraph) => paragraph !== '-' && paragraph.length > 1)

  if (paragraphs.length === 0) {
    return <p className="text-muted">No additional content was extracted for this item yet.</p>
  }

  return (
    <>
      {paragraphs.slice(0, 12).map((paragraph, index) => (
        <p key={index} className="text-[1.02rem]">
          {paragraph}
        </p>
      ))}
    </>
  )
}

function getFeatured(snapshot: CmsSnapshot, limit: number) {
  return [...snapshot.products]
    .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime())
    .slice(0, limit)
}

export default App
