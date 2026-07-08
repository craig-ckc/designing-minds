import { Eyebrow } from '../ui/eyebrow'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'

export function FounderSection() {
  return (
    <Section className="bg-surface-alt" containerClassName="grid items-center gap-9 lg:grid-cols-[0.95fr_1.05fr] lg:gap-[72px]">
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
    </Section>
  )
}

