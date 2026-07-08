import { useState } from 'react'
import { Card } from '../ui/card'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { GrowthChart } from './growth-chart'
import howItWorksSteps from '../../content/home/how-it-works-steps.json'

const steps = howItWorksSteps as { when: string; title: string; items: string[] }[]

export function HowItWorksSection() {
  const [active, setActive] = useState(0)
  const go = (dir: number) => setActive((a) => Math.min(Math.max(a + dir, 0), steps.length - 1))

  return (
    <Section className="bg-cream">
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <h2>From cart to classroom in minutes</h2>
      </div>
      <Card pad="md" className="lg:p-10">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => {
            const isActive = i === active
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => setActive(i)}
                aria-current={isActive ? 'step' : undefined}
                className={`rounded-control p-5 text-left transition-colors ${isActive ? 'bg-primary-tint' : 'hover:bg-surface-alt'}`}
              >
                <p className={`text-caption font-bold uppercase tracking-[0.08em] ${isActive ? 'text-primary' : 'text-muted'}`}>
                  {s.when}
                </p>
                <h4 className="mt-1">{s.title}</h4>
                <ul className="mt-3 grid gap-4 text-body text-ink-soft">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-4.5">
                      <span className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-pill bg-primary text-on-primary">
                        <span className="h-2.5 w-2.5">
                          <Icon name="check" />
                        </span>
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={`h-2 rounded-pill transition-all duration-300 ${i === active ? 'w-6 bg-primary' : 'w-2 bg-line-strong'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous phase"
              disabled={active === 0}
              onClick={() => go(-1)}
              className="grid h-10 w-10 place-items-center rounded-pill border border-line-strong text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-ink"
            >
              <span className="h-[18px] w-[18px] rotate-180">
                <Icon name="arrow" />
              </span>
            </button>
            <button
              type="button"
              aria-label="Next phase"
              disabled={active === steps.length - 1}
              onClick={() => go(1)}
              className="grid h-10 w-10 place-items-center rounded-pill border border-line-strong text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-ink"
            >
              <span className="h-[18px] w-[18px]">
                <Icon name="arrow" />
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5">
          <GrowthChart active={active} />
        </div>
      </Card>
    </Section>
  )
}
