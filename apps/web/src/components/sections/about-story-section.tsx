import { Icon, type IconName } from '../ui/icon'
import { Polaroid } from '../ui/polaroid'
import { Section } from '../ui/section'

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'globe',
    title: 'It started in the classroom',
    body: 'After teaching in Vietnam and working with online schools back home in South Africa, I saw first-hand how the right resources change the way a child learns.',
  },
  {
    icon: 'pencil',
    title: 'Built by a teacher, for real learning',
    body: 'I combined years of curriculum development with everyday classroom experience to write CAPS-aligned tests and summaries that parents could actually trust.',
  },
  {
    icon: 'spark',
    title: 'Confidence over cramming',
    body: 'Designing Minds grew into affordable printable resources that ease exam-day stress and help learners believe in what they can do.',
  },
]

export function AboutStorySection() {
  return (
    <Section containerClassName="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div>
        <h2 className="max-w-[18ch]">From one classroom to homes across South Africa</h2>
        <p className="mt-5 max-w-[52ch] text-body-lg text-ink-soft">
          Hi, I’m Amy — the teacher behind Designing Minds. Here’s how a classroom idea grew into resources used by
          families right across South Africa.
        </p>

        <ol className="relative mt-10 grid gap-8">
          <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-line" />
          {STEPS.map((step) => (
            <li key={step.title} className="relative grid grid-cols-[auto_1fr] items-start gap-4">
              <span className="relative z-10 grid h-11 w-11 place-items-center rounded-pill border border-line bg-surface text-primary shadow-cover">
                <Icon name={step.icon} size={22} />
              </span>
              <div className="pt-1">
                <h4>{step.title}</h4>
                <p className="mt-1.5 text-body text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Scattered photo cluster with a playful accent. */}
      <div className="relative mx-auto aspect-[5/4] w-full max-w-md lg:mx-0">
        <Polaroid caption="Est. 2019" rotate="-5deg" ratio="4 / 5" className="absolute left-0 top-0 w-3/5" />
        <Polaroid caption="Loved in SA" rotate="6deg" ratio="1 / 1" className="absolute bottom-0 right-1 w-[58%]" />
        <span aria-hidden className="absolute -top-3 right-6 text-butter">
          <Icon name="spark" size={56} weight="fill" />
        </span>
      </div>
    </Section>
  )
}
