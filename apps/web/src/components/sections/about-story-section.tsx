import { Polaroid } from '../ui/polaroid'
import { Section } from '../ui/section'

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Teaching in Vietnam and South Africa',
    body: 'After teaching in Vietnam and working with online schools in South Africa, I saw how much accessible learning tools can help.',
  },
  {
    title: 'Curriculum experience, put to use',
    body: 'I combined my curriculum development experience with my love of teaching and started Designing Minds, to help learners feel confident, prepared and supported.',
  },
  {
    title: 'More confidence, less stress',
    body: 'What I enjoy most is seeing marks go up and stress come down, and learners start to believe in themselves.',
  },
]

export function AboutStorySection() {
  return (
    <Section containerClassName="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div>
        <h2 className="max-w-[18ch]">Meet Amy, founder of Designing Minds</h2>
        <p className="mt-5 max-w-[52ch] text-body-lg text-ink-soft">
          A teacher who wanted learning to feel less stressful.
        </p>

        {/* Figma: ruled rows (24px padding, 32px gap), a 220px bold title beside a 437px body. */}
        <ol className="mt-10 border-b border-line">
          {STEPS.map((step) => (
            <li key={step.title} className="grid gap-2 border-t border-line py-6 sm:grid-cols-[minmax(0,220px)_minmax(0,437px)] sm:items-center sm:gap-8">
              <h3 className="text-h4">{step.title}</h3>
              <p className="text-body-lg text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Scattered photo cluster. */}
      <div className="relative mx-auto aspect-[5/4] w-full max-w-[600px] lg:mx-0">
        <Polaroid
          src="/images/image-07.png"
          alt="An adult helping a child draw"
          caption="Loved in SA"
          rotate="6deg"
          ratio="1 / 1"
          className="absolute bottom-0 right-1 w-[58%]"
        />
        <Polaroid
          src="/images/image-06.png"
          alt="Amy, founder of Designing Minds"
          caption="Amy"
          rotate="-5deg"
          ratio="4 / 5"
          className="absolute left-0 top-0 w-3/5"
        />
      </div>
    </Section>
  )
}
