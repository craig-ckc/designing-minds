import { type AccessPlanTier, priceLabel } from '@designing-minds/cms'
import { Container } from '../ui/Container'
import { Eyebrow } from '../ui/Eyebrow'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'

// Tier copy is derived from the structural difference (term vs year) plus the
// shared inclusions. See ADR 0005 — plans are one-time purchases, no auto-renewal.
const TIER_CONTENT: Record<AccessPlanTier['tier'], { includes: string[]; excludes: string[]; cta: string }> = {
  essential: {
    includes: [
      'One term of resources for one grade',
      'All core subjects',
      'Two CAPS-aligned tests per subject',
      'A memorandum with every test',
      'Instant download on your order page',
    ],
    excludes: ['Other terms — bought separately', 'Priority new releases'],
    cta: 'Choose a grade & term',
  },
  premium: {
    includes: [
      'Every term — the full school year',
      'All core subjects',
      'Two CAPS-aligned tests per subject',
      'A memorandum with every test',
      'Instant download on your order page',
    ],
    excludes: [],
    cta: 'Choose a grade',
  },
}

const periodLabel = (period: AccessPlanTier['period']) => (period === 'Year' ? 'per year' : 'per term')

/** Access-plan comparison. Each card is a tier that deep-links into /packages. */
export function PricingSection({ tiers }: { tiers: AccessPlanTier[] }) {
  if (tiers.length === 0) return null
  return (
    <section className="section" id="plans">
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>Access plans</Eyebrow>
          <h2>Buy one term, or the whole year</h2>
          <p className="mt-4 lead">
            Each plan covers one grade and is a once-off purchase for the period it covers. Pick your grade on the next
            step — nothing renews automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {tiers.map((tier) => {
            const content = TIER_CONTENT[tier.tier]
            return (
              <article
                key={tier.tier}
                className={`flex flex-col gap-5 rounded-[10px] bg-surface p-8 ${
                  tier.featured ? 'border-2 border-ink' : 'border border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3>{tier.title}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <strong className="text-[2.4rem] font-semibold tracking-[-0.03em]">{priceLabel(tier.fromPriceZar)}</strong>
                      <span className="text-muted">once-off · {periodLabel(tier.period)}</span>
                    </div>
                  </div>
                  {tier.featured ? (
                    <span className="rounded-full bg-ink px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.08em] text-white">
                      Best value
                    </span>
                  ) : null}
                </div>
                <ul className="grid gap-3">
                  {content.includes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[0.95rem] text-ink-soft">
                      <span className="mt-0.5 h-[18px] w-[18px] flex-none text-ink">
                        <Icon name="check" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {content.excludes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[0.95rem] text-muted">
                      <span className="mt-0.5 h-[18px] w-[18px] flex-none text-muted">
                        <Icon name="close" />
                      </span>
                      <span className="line-through decoration-line">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button to={`/packages?tab=plans&plan=${tier.tier}`} variant={tier.featured ? 'solid' : 'outline'} className="w-full">
                  {content.cta}
                </Button>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
