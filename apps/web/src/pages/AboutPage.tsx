import { type CmsSnapshot } from '@designing-minds/cms'
import { PROOF_POINTS } from '../content/site'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Placeholder } from '../components/ui/Placeholder'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { StatsRow } from '../components/sections/StatsRow'
import { TestimonialsSection } from '../components/sections/TestimonialsSection'
import { CtaBanner } from '../components/sections/CtaBanner'

function SectionNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <h3>{title}</h3>
      <p className="mx-auto mt-3 max-w-[560px] text-muted">{body}</p>
    </div>
  )
}

function AboutHero() {
  return (
    <section className="section">
      <Container className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
        <div>
          <Eyebrow>About Designing Minds</Eyebrow>
          <h1>Shaping confident learners, one test at a time</h1>
          <p className="mt-5 lead">
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
  )
}

function AboutStatsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  return (
    <section className="section-tight bg-surface-alt">
      <Container>
        <StatsRow
          stats={[
            { value: '70+', label: 'Families helped' },
            { value: snapshot ? String(snapshot.stats.gradeCount) : '5', label: 'Grades supported' },
            { value: snapshot ? String(snapshot.stats.productCount) : '...', label: 'Resources created' },
            { value: '100%', label: 'CAPS aligned' },
          ]}
        />
      </Container>
    </section>
  )
}

function OurStorySection() {
  return (
    <section className="section">
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
  )
}

function FounderSection() {
  return (
    <section className="section bg-surface-alt">
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
  )
}

function AboutTestimonialsSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (snapshot) return <TestimonialsSection testimonials={snapshot.testimonials.filter((t) => t.published)} />

  return (
    <section className="section">
      <Container>
        <SectionNotice
          title={loadError ? 'Testimonials are unavailable' : 'Loading testimonials...'}
          body={loadError ?? 'The story is ready now; parent feedback will appear when the content request finishes.'}
        />
      </Container>
    </section>
  )
}

function AboutCtaSection() {
  return (
    <section className="section">
      <Container>
        <CtaBanner
          title="Ready to support your child’s learning journey?"
          body="Explore our printable CAPS-aligned tests and learning resources, made to build confidence, reduce stress, and make learning fun."
        >
          <Button to="/shop" variant="text-light">
            Browse Tests
          </Button>
        </CtaBanner>
      </Container>
    </section>
  )
}

export function AboutPage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  return (
    <>
      <AboutHero />
      <AboutStatsSection snapshot={snapshot} />
      <OurStorySection />
      <FounderSection />
      <AboutTestimonialsSection snapshot={snapshot} loadError={loadError} />
      <AboutCtaSection />
    </>
  )
}
