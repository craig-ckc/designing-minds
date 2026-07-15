import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
      <h2 className="max-w-[20ch] lg:col-start-2 lg:row-start-1">
        Where passion for teaching meets a heart for learners
      </h2>
      <div className="max-w-[58ch] space-y-4 text-body-lg text-ink-soft lg:col-start-1 lg:row-start-1">
        <p>
          Designing Minds was created from a simple idea: every parent deserves easy access to quality learning
          resources that help their children feel confident and prepared.
        </p>
        <p>
          We design affordable, CAPS-aligned printable tests that make studying stress-free, structured, and engaging.
          Our resources are crafted by teachers, tested by parents, and loved by learners across South Africa.
        </p>
        <p>
          Each test is created to build confidence, reduce exam anxiety, and familiarise learners with real
          classroom-style questions, so they walk into every test ready to succeed.
        </p>
      </div>
    </Section>
  )
}
