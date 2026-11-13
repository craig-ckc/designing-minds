import { Section } from '../ui/section'

export type ValueItem = { title: string; body: string }

const VALUES: ValueItem[] = [
  {
    title: 'CAPS-aligned',
    body: 'Suitable for learners in every South African province and aligned with the CAPS curriculum.',
  },
  {
    title: 'Easy to use',
    body: 'Detailed memorandums make marking simple, while instant downloads let you print whenever you need to.',
  },
  {
    title: 'Familiar questions',
    body: 'Classroom-style questions help reduce exam stress before assessment day.',
  },
]

/** Painted folders banner, then a 380px heading column and three plain columns split by hairlines (Figma `AboutValuesSection`). */
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
        className="h-40 w-full rounded-lg object-cover sm:h-48 lg:h-60"
      />
      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
        <h2 className="max-w-[16ch]">{heading}</h2>
        <div className="grid gap-8 md:grid-cols-3 md:gap-0">
          {values.map((value) => (
            <article key={value.title} className="md:border-l md:border-line md:px-6 md:first:border-l-0 md:first:pl-0">
              <h3>{value.title}</h3>
              <p className="mt-3 text-body-lg text-ink-soft">{value.body}</p>
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
