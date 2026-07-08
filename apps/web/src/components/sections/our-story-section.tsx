import { Eyebrow } from '../ui/eyebrow'
import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="grid justify-items-center">
      <div className="mb-9 max-w-[640px] text-center lg:mb-14">
        <Eyebrow>Our story</Eyebrow>
        <h2>Where a passion for teaching meets a heart for learners</h2>
      </div>
      <div className="grid max-w-[70ch] gap-4 text-ink-soft">
        <p className="text-[1.02rem]">
          Designing Minds was created from a simple idea: that every parent deserves easy access to quality learning
          resources that help their children feel confident and prepared.
        </p>
        <p className="text-[1.02rem]">
          We design affordable, CAPS-aligned printable tests that make studying stress-free, structured, and engaging.
          Our resources are crafted by teachers, tested by parents, and loved by learners across South Africa.
        </p>
        <p className="text-[1.02rem]">
          Each test is created to build confidence, reduce exam anxiety, and familiarise learners with real
          classroom-style questions — so they walk into every test ready to succeed.
        </p>
      </div>
    </Section>
  )
}

