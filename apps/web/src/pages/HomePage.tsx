import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { GRADE_BLURB, PROOF_POINTS, WHY_FEATURES } from '../content/site'
import { getFeatured } from '../lib/products'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Icon, type IconName } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { ProductCard } from '../components/ProductCard'
import { NewsletterForm } from '../components/NewsletterForm'
import { StatsRow } from '../sections/StatsRow'
import { PricingSection } from '../sections/PricingSection'
import { TestimonialsSection } from '../sections/TestimonialsSection'
import { CtaBanner } from '../sections/CtaBanner'

const FEATURE_ICONS: IconName[] = ['doc', 'shield', 'download', 'spark']

export function HomePage({ snapshot }: { snapshot: CmsSnapshot }) {
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
      <section className="section">
        <Container className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
          <div>
            <Eyebrow>Printable · CAPS-aligned · Grades 3–7</Eyebrow>
            <h1>{snapshot.spotlight.headline}</h1>
            <p className="mt-5 lead">
              Support your child’s learning at home with high-quality, CAPS-aligned practice materials — crafted by
              teachers, tested by parents, and loved by learners across South Africa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/shop" variant="text">
                Browse Tests
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Button>
              <Button href="#plans" variant="text">
                Compare plans
              </Button>
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
      <section className="section-tight bg-surface-alt">
        <Container>
          <StatsRow stats={stats} />
        </Container>
      </section>

      {/* Grade finder */}
      <section className="section">
        <Container>
          <div className="mb-9 max-w-[640px] lg:mb-14">
            <Eyebrow>Find by grade</Eyebrow>
            <h2>Find resources for your child’s grade</h2>
            <p className="mt-4 lead">
              Explore CAPS-aligned printable tests and learning resources for Grades 3 to 7.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {snapshot.filters.grades.map((grade) => (
              <Link
                key={grade}
                to={`/shop?grade=${encodeURIComponent(grade)}`}
                className="group flex items-center gap-6 border border-line bg-surface p-6 transition hover:border-ink"
              >
                <Placeholder label={grade} className="aspect-[4/3] w-40 flex-none rounded-none" />
                <span className="flex flex-col gap-2">
                  <span className="text-[1.25rem] font-semibold">{grade}</span>
                  <span className="text-muted">{GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-ink underline underline-offset-4">
                    Browse tests
                    <span className="h-3.5 w-3.5">
                      <Icon name="arrow" />
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Featured tests */}
      <section className="section bg-surface-alt">
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
      <section className="section">
        <Container>
          <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
            <Eyebrow>Why parents love Designing Minds</Eyebrow>
            <h2>Learning made simple, affordable, and confidence-boosting</h2>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
            {WHY_FEATURES.map((feature, index) => (
              <article key={feature.title} className="flex gap-5">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-[10px] bg-surface-sunk text-ink-soft">
                  <span className="h-6 w-6">
                    <Icon name={FEATURE_ICONS[index] ?? 'doc'} />
                  </span>
                </span>
                <div>
                  <h4 className="mb-2">{feature.title}</h4>
                  <p className="text-muted">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Full-year bundle CTA */}
      <section className="section">
        <Container>
          <CtaBanner
            eyebrow="Full year access · R1,200 once-off"
            title="Everything your child needs for the full school year"
            body="Give your child every CAPS-aligned test for their grade with our Full Year Test Bundles for Grades 4 to 7 — automatically delivered each term."
          >
            <Button to="/shop" variant="text-light">
              Get Full Year Access
            </Button>
            <Button to="/about" variant="text-light">
              Learn more
            </Button>
          </CtaBanner>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="section-tight bg-surface-alt">
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <Eyebrow>Free test</Eyebrow>
            <h2>Get a free test when you subscribe</h2>
            <p className="mt-4 lead">
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
