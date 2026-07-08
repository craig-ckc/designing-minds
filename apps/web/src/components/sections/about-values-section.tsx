import { Card } from '../ui/card'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'

const VALUES: { icon: IconName; tone: string; title: string; body: string }[] = [
  {
    icon: 'pencil',
    tone: 'bg-blossom text-magenta',
    title: 'Made by teachers',
    body: 'Every test and summary is written by practising South African teachers and mapped to the CAPS curriculum.',
  },
  {
    icon: 'download',
    tone: 'bg-butter text-amber',
    title: 'Affordable & once-off',
    body: 'Buy once, download instantly, and print as often as you like. No subscriptions, no renewals, no surprises.',
  },
  {
    icon: 'shield',
    tone: 'bg-lagoon text-teal',
    title: 'Built for confidence',
    body: 'Real classroom-style questions that ease exam anxiety and help learners believe in what they can do.',
  },
]

export function AboutValuesSection() {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <p className="mb-4 text-label font-bold uppercase tracking-[0.14em] text-primary">What we stand for</p>
        <h2>Learning that’s simple, honest, and kind</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {VALUES.map((value) => (
          <Card key={value.title} variant="surface" pad="lg" className="text-left">
            <span className={`grid h-11 w-11 place-items-center rounded-lg ${value.tone}`}>
              <span className="h-6 w-6">
                <Icon name={value.icon} />
              </span>
            </span>
            <h4 className="mt-4">{value.title}</h4>
            <p className="mt-2 text-body text-muted">{value.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
