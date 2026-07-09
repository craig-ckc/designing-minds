import { Card } from '../ui/card'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'

const VALUES: { title: string; body: string }[] = [
  {
    title: 'Made by teachers',
    body: 'Every test and summary is written by practising South African teachers and mapped to the CAPS curriculum.',
  },
  {
    title: 'Affordable & once-off',
    body: 'Buy once, download instantly, and print as often as you like. No subscriptions, no renewals, no surprises.',
  },
  {
    title: 'Built for confidence',
    body: 'Real classroom-style questions that ease exam anxiety and help learners believe in what they can do.',
  },
]

export function AboutValuesSection() {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <h2>Learning that’s simple, honest, and kind</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {VALUES.map((value) => (
          <Card key={value.title} as="article" pad="none" className="overflow-hidden text-center">
            <Placeholder ratio="1 / 1" flush />
            <div className="p-7">
              <h4>{value.title}</h4>
              <p className="mt-2 text-body text-muted">{value.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}
