import { PROOF_POINTS } from '../../content/site'
import { Eyebrow } from '../ui/eyebrow'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'
import { Tag } from '../ui/tag'

export function AboutHeroSection() {
  return (
    <Section containerClassName="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[72px]">
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
    </Section>
  )
}

