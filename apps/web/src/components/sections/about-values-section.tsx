import { Card } from '../ui/card'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'

const VALUES: { title: string; body: string; icon: IconName; iconClassName: string }[] = [
  {
    title: 'CAPS-aligned',
    body: 'Suitable for learners in every South African province and aligned with the CAPS curriculum.',
    icon: 'check',
    iconClassName: 'bg-primary-tint text-primary',
  },
  {
    title: 'Easy to use',
    body: 'Detailed memorandums make marking simple, while instant downloads let you print whenever you need to.',
    icon: 'smile',
    iconClassName: 'bg-lagoon text-teal',
  },
  {
    title: 'Built for confidence',
    body: 'Familiar classroom-style questions help reduce exam stress and build confidence before assessment day.',
    icon: 'trend',
    iconClassName: 'bg-butter text-amber',
  },
]

export function AboutValuesSection() {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <h2>Learning support designed for real families</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {VALUES.map((value) => (
          <Card key={value.title} as="article" pad="none" className="overflow-hidden text-center">
            <div className="p-7 sm:p-8">
              <span
                className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-pill ${value.iconClassName}`}
                aria-hidden
              >
                <Icon name={value.icon} size={28} />
              </span>
              <h3>{value.title}</h3>
              <p className="mt-2 text-body text-muted">{value.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}
