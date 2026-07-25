import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
      <div className="mx-auto max-w-[58ch]">
        <h2>Where passion for teaching meets a heart for learners</h2>
        <div className="mt-6 space-y-4 text-body-lg text-ink-soft">
          <p>
            Designing Minds was created from a simple idea: every parent deserves easy access to quality learning
            resources that help their children feel confident and prepared.
          </p>
          <p>
            We design affordable, CAPS-aligned printable tests that make studying stress-free, structured, and
            engaging. Our resources are crafted by teachers, tested by parents, and loved by learners across South
            Africa.
          </p>
          <p>
            Each test is created to build confidence, reduce exam anxiety, and familiarise learners with real
            classroom-style questions, so they walk into every test ready to succeed.
          </p>
        </div>
      </div>

      <img
        src="/images/image-08.png"
        alt="A selection of Designing Minds assessment covers"
        className="mx-auto w-full max-w-[34rem] object-contain"
        loading="lazy"
        decoding="async"
      />
    </Section>
  )
}
