import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'

export function FounderSection() {
  return (
    <Section containerClassName="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <div aria-hidden className="absolute inset-0 -translate-x-4 translate-y-4 rounded-panel bg-meadow" />
        <Placeholder label="Meet Amy" ratio="4 / 3.4" className="relative rounded-panel" />
      </div>
      <div>
        <h2>A teacher with a vision for stress-free learning</h2>
        <div className="mt-5 grid gap-4 text-ink-soft">
          <p className="text-body-lg">
            Hi, I’m Amy. After teaching in Vietnam and working with online schools in South Africa, I discovered how
            powerful accessible learning tools can be. I combined my experience in curriculum development with my love
            for teaching to create Designing Minds — a platform dedicated to helping learners feel confident, prepared,
            and supported.
          </p>
          <p className="text-body-lg">
            What excites me most is seeing how these resources not only improve marks, but also reduce stress and give
            learners belief in their own abilities.
          </p>
        </div>
      </div>
    </Section>
  )
}

