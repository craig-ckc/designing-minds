import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="text-center">
      <div className="mx-auto max-w-prose">
        <h2 className="mx-auto max-w-[20ch]">Where passion for teaching meets a heart for learners</h2>
        <div className="mx-auto mt-6 grid max-w-[58ch] gap-4 text-body-lg text-ink-soft">
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
      </div>
    </Section>
  )
}
