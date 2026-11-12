import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <img
        src="/images/paintings/our-story-sunny-desk.avif"
        alt=""
        width={1024}
        height={1280}
        loading="lazy"
        decoding="async"
        className="aspect-[5/4] w-full rounded-lg object-cover"
      />
      <div className="max-w-[52ch]">
        <h2 className="text-h1">Why Designing Minds exists</h2>
        <blockquote className="mt-6 border-l-2 border-primary pl-5 text-h3 font-semibold leading-[1.35] tracking-[-0.02em]">
          Designing Minds was created from a simple idea: every parent deserves easy access to quality learning
          resources that help their children feel confident and prepared.
        </blockquote>
        <p className="mt-5 text-body text-ink-soft">
          We make affordable, CAPS-aligned printable tests. Teachers write them and parents use them at home, so
          learners walk into the real test knowing what to expect.
        </p>
      </div>
    </Section>
  )
}
