import { type Product, priceLabel } from '@designing-minds/cms'
import { Container } from '../ui/Container'
import { Eyebrow } from '../ui/Eyebrow'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'

const planFeatures = (plan: Product): string[] => {
  const terms = plan.accessPeriod === 'Year' ? 'All four terms' : 'One term of resources'
  const subjects = plan.includedSubjects?.length ? `${plan.includedSubjects.length} core subjects` : 'Core subjects'
  return [terms, subjects, 'Memorandums included', 'Instant download on your order page', 'One-time purchase — no auto-renewal']
}

/** Access-plan comparison. Plans are one-time purchases (see ADR 0001). */
export function PricingSection({ plans }: { plans: Product[] }) {
  if (plans.length === 0) return null
  return (
    <section className="section" id="plans">
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>Access plans</Eyebrow>
          <h2>Buy one term, or the whole year</h2>
          <p className="mt-4 lead">
            Each plan is a once-off purchase for the period it covers. Nothing renews automatically — buy again when you
            are ready.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col gap-5 rounded-[10px] bg-surface p-8 ${
                plan.featured ? 'border-2 border-ink' : 'border border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3>{plan.title}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="text-[2.4rem] font-semibold tracking-[-0.03em]">{priceLabel(plan.priceZar)}</strong>
                    <span className="text-muted">once-off · {plan.accessPeriod === 'Year' ? 'per year' : 'per term'}</span>
                  </div>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-ink px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.08em] text-white">
                    Best value
                  </span>
                ) : null}
              </div>
              <ul className="grid gap-3">
                {planFeatures(plan).map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[0.95rem] text-ink-soft">
                    <span className="mt-0.5 h-[18px] w-[18px] flex-none text-ink">
                      <Icon name="check" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button to={`/product/${plan.slug}`} variant={plan.featured ? 'solid' : 'outline'} className="w-full">
                View {plan.accessPeriod === 'Year' ? 'yearly' : 'term'} access
              </Button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
