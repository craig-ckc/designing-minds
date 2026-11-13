import { Section } from '../ui/section'

/** Figma About "Why": a 672px 5:4 painting, a 64px gap, then the 640px copy column. */
export function OurStorySection() {
  return (
    <Section containerClassName="grid items-center gap-10 lg:grid-cols-[minmax(0,672fr)_minmax(0,640fr)] lg:gap-16">
      <img
        src="/images/paintings/our-story-exercise-books.avif"
        alt=""
        width={1024}
        height={819}
        loading="lazy"
        decoding="async"
        className="aspect-[5/4] w-full rounded-lg object-cover"
      />
      <div className="max-w-[640px]">
        <h2 className="text-h1">Why Designing Minds exists</h2>
        <blockquote className="mt-8 border-l-[3px] border-line-strong pl-5 text-h3 font-semibold leading-[1.35] tracking-[-0.02em] lg:mt-12">
          Designing Minds was created from a simple idea: every parent deserves easy access to quality learning
          resources that help their children feel confident and prepared.
        </blockquote>
        <p className="mt-6 text-body-lg text-ink-soft">
          We make affordable, CAPS-aligned printable tests. Teachers write them and parents use them at home, so
          learners walk into the real test knowing what to expect.
        </p>
      </div>
    </Section>
  )
}
