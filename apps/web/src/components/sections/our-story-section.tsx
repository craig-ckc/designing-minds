import { Section } from '../ui/section'

export function OurStorySection() {
  return (
    <Section containerClassName="text-center">
      <div className="mx-auto max-w-prose">
        <p className="mb-4 text-label font-bold uppercase tracking-[0.14em] text-primary">Why we exist</p>
        <h2 className="mx-auto max-w-[20ch]">Where a passion for teaching meets a heart for learners</h2>
        <div className="mx-auto mt-6 grid max-w-[58ch] gap-4 text-body-lg text-ink-soft">
          <p>
            Designing Minds began with a simple belief: every parent deserves easy access to quality learning resources
            that help their children feel confident and prepared — without the stress, the guesswork, or the cost.
          </p>
          <p>
            So we make affordable, CAPS-aligned printable tests and summaries that are crafted by teachers, tested by
            parents, and loved by learners across South Africa — ready to print and practise, again and again.
          </p>
        </div>
      </div>
    </Section>
  )
}
