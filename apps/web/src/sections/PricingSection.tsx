import { PLANS } from '../content/site'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'

export function PricingSection() {
  return (
    <section className="section" id="plans">
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>Plans</Eyebrow>
          <h2>Choose the best learning plan for your child</h2>
          <p className="mt-4 lead">Pay per term, or unlock everything for the year with over R200 in savings.</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col gap-5.5 rounded-[10px] bg-surface p-8 ${
                plan.featured ? 'border-2 border-ink' : 'border border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3>{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="text-[2.6rem] font-semibold tracking-[-0.03em]">{plan.price}</strong>
                    <span className="text-muted">{plan.cadence}</span>
                  </div>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-ink px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.08em] text-white">
                    Best value
                  </span>
                ) : null}
              </div>
              <ul className="grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[0.95rem] text-ink-soft">
                    <span className="mt-0.5 h-[18px] w-[18px] flex-none text-ink">
                      <Icon name="check" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button to="/shop" variant="text" className="w-full">
                {plan.cta}
              </Button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
