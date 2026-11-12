import { Section } from '../ui/section'

export type ValueItem = { title: string; body: string; bar: 'bg-yellow' | 'bg-green' | 'bg-blue' }

const VALUES: ValueItem[] = [
  {
    title: 'CAPS-aligned',
    body: 'Suitable for learners in every South African province and aligned with the CAPS curriculum.',
    bar: 'bg-yellow',
  },
  {
    title: 'Easy to use',
    body: 'Detailed memorandums make marking simple, while instant downloads let you print whenever you need to.',
    bar: 'bg-green',
  },
  {
    title: 'Familiar questions',
    body: 'Classroom-style questions help reduce exam stress before assessment day.',
    bar: 'bg-blue',
  },
]

/** Painted folders banner, then a heading on the left and three columns, each with a small pastel colour bar. */
export function ValuesBanner({ heading, values }: { heading: string; values: ValueItem[] }) {
  return (
    <Section>
      <img
        src="/images/paintings/values-grade-folders.avif"
        alt=""
        width={1920}
        height={640}
        loading="lazy"
        decoding="async"
        className="aspect-[3/1] max-h-72 w-full rounded-lg object-cover"
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] lg:gap-12">
        <h2 className="max-w-[16ch]">{heading}</h2>
        <div className="grid gap-8 md:grid-cols-3 md:gap-0">
          {values.map((value) => (
            <article key={value.title} className="md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0">
              <span aria-hidden className={`block h-1 w-8 rounded-full ${value.bar}`} />
              <h3 className="mt-4">{value.title}</h3>
              <p className="mt-2 text-body text-muted">{value.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function AboutValuesSection() {
  return <ValuesBanner heading="What you can expect from every resource" values={VALUES} />
}
