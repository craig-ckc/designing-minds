import { Eyebrow } from '../ui/eyebrow'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { GrowthChart } from './growth-chart'
import howItWorksSteps from '../../content/home/how-it-works-steps.json'

export function HowItWorksSection() {
  return (
    <Section className="bg-cream">
      <div className="mx-auto mb-10 max-w-[680px] text-center lg:mb-14">
        <div className="flex justify-center">
          <Eyebrow>How it works</Eyebrow>
        </div>
        <h2>From cart to classroom in minutes</h2>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card lg:p-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {howItWorksSteps.map((s) => (
            <div key={s.title} className={`rounded-xl p-5 ${s.highlight ? 'bg-primary-tint' : ''}`}>
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">{s.when}</p>
              <h4 className="mt-1">{s.title}</h4>
              <ul className="mt-3 grid gap-4 text-[0.95rem] text-ink-soft">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-4.5">
                    <span className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-primary text-white">
                      <span className="h-2.5 w-2.5">
                        <Icon name="check" />
                      </span>
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <GrowthChart />
        </div>
      </div>
    </Section>
  )
}
