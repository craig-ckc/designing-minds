import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot, accessPlanProducts } from '@designing-minds/cms'
import { GRADE_BLURB, PROOF_POINTS, WHY_FEATURES, gradeToSlug } from '../content/site'
import { getFeatured } from '../lib/products'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Icon, type IconName } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { FaqAccordion } from '../components/ui/FaqAccordion'
import { ProductCard } from '../components/ProductCard'
import { NewsletterForm } from '../components/NewsletterForm'
import { StatsRow } from '../sections/StatsRow'
import { PricingSection } from '../sections/PricingSection'
import { TestimonialsSection } from '../sections/TestimonialsSection'
import { CtaBanner } from '../sections/CtaBanner'

const FEATURE_ICONS: IconName[] = ['doc', 'shield', 'download', 'spark']

export function HomePage({ snapshot }: { snapshot: CmsSnapshot }) {
  const featured = useMemo(() => getFeatured(snapshot, 6), [snapshot])
  const plans = useMemo(() => accessPlanProducts(snapshot), [snapshot])
  const testimonials = useMemo(() => snapshot.testimonials.filter((t) => t.published && t.featured), [snapshot])
  const homeFaqs = useMemo(() => snapshot.faqs.filter((f) => f.published).slice(0, 5), [snapshot])

  const stats = [
    { value: String(snapshot.stats.gradeCount), label: 'Grades supported' },
    { value: '70+', label: 'Families helped' },
    { value: String(snapshot.stats.productCount), label: 'Resources & bundles' },
    { value: String(snapshot.stats.subjectCount), label: 'Subjects covered' },
  ]

  return (
    <>
      {/* Hero */}
      <section className="section">
        <Container className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
          <div>
            <Eyebrow>Printable · CAPS-aligned · Grades 3–7</Eyebrow>
            <h1>CAPS-aligned practice resources that build confidence at home</h1>
            <p className="mt-5 lead">
              Teacher-made, parent-tested printable tests and summaries for Grades 3 to 7 — bought once, downloaded
              instantly, printed as often as you like.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/shop" variant="solid">
                Browse resources
                <span className="h-4 w-4">
                  <Icon name="arrow" />
                </span>
              </Button>
              <Button to="/bundles" variant="outline">
                See bundles &amp; plans
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
            <p className="mt-4 lead">Explore CAPS-aligned printable resources for Grades 3 to 7.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {snapshot.valueLists.grades.map((grade) => (
              <Link
                key={grade}
                to={`/grades/${gradeToSlug(grade)}`}
                className="group flex items-center gap-6 border border-line bg-surface p-6 transition hover:border-ink"
              >
                <Placeholder label={grade} className="aspect-[4/3] w-40 flex-none rounded-none" />
                <span className="flex flex-col gap-2">
                  <span className="text-[1.25rem] font-semibold">{grade}</span>
                  <span className="text-muted">{GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-ink underline underline-offset-4">
                    Browse resources
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

      {/* Access plans */}
      <PricingSection plans={plans} />

      {/* Featured resources */}
      <section className="section bg-surface-alt">
        <Container>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6 lg:mb-11">
            <div className="max-w-[640px]">
              <Eyebrow>Featured resources</Eyebrow>
              <h2>Popular CAPS-aligned resources</h2>
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
            <Eyebrow>Why parents choose Designing Minds</Eyebrow>
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
      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-[820px]">
            <div className="mb-8 text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2>Common questions</h2>
            </div>
            <FaqAccordion faqs={homeFaqs} />
            <div className="mt-6 text-center">
              <Button to="/help" variant="text">
                See all help topics
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Bundle CTA */}
      <section className="section bg-surface-alt">
        <Container>
          <CtaBanner
            eyebrow="Bundles & access plans"
            title="Cover a whole term or the full year in one purchase"
            body="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a term or year — no auto-renewal."
          >
            <Button to="/bundles" variant="text-light">
              Browse bundles &amp; plans
            </Button>
            <Button to="/about" variant="text-light">
              Learn more
            </Button>
          </CtaBanner>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="section-tight bg-surface">
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <Eyebrow>Stay in the loop</Eyebrow>
            <h2>New resources, straight to your inbox</h2>
            <p className="mt-4 lead">
              Subscribe for new releases and learning tips. We’ll send you a free CAPS-aligned practice resource to start.
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
