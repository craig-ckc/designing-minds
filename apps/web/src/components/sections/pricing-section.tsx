import { type AccessPlanTier, priceLabel } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { Icon } from '../ui/icon'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Pill } from '../ui/pill'

// Tier copy is derived from the structural difference (term vs year) plus the
// shared inclusions. See docs/decisions.md.
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
    <Section id="plans">
        <div className="mx-auto mb-9 max-w-prose text-center lg:mb-14">
          <h2>Buy one term, or the whole year</h2>
          <p className="mt-4 lead">
            Each plan covers one grade and is a once-off purchase for the period it covers. Pick your grade on the next
            step — nothing renews automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tiers.map((tier) => {
            const content = TIER_CONTENT[tier.tier]
            return (
              <Card
                as="article"
                key={tier.tier}
                variant={tier.featured ? 'featured' : 'surface'}
                pad="lg"
                shadow="soft"
                className="flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3>{tier.title}</h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <strong className="text-[2.6rem] font-extrabold tracking-[-0.03em] text-primary">{priceLabel(tier.fromPriceZar)}</strong>
                      <span className="text-muted">once-off · {periodLabel(tier.period)}</span>
                    </div>
                  </div>
                  {tier.featured ? (
                    <Pill tone="solid" size="sm" className="px-3 font-bold uppercase tracking-[0.06em]">
                      Best value
                    </Pill>
                  ) : null}
                </div>
                <ul className="grid gap-3">
                  {content.includes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-body text-ink-soft">
                      <span className="mt-0.5 grid h-[20px] w-[20px] flex-none place-items-center rounded-pill bg-primary text-on-primary">
                        <span className="h-3 w-3">
                          <Icon name="check" />
                        </span>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {content.excludes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-body text-muted">
                      <span className="mt-0.5 h-[20px] w-[20px] flex-none text-muted">
                        <Icon name="close" />
                      </span>
                      <span className="line-through decoration-line">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button to={`/packages?plan=${tier.tier}`} variant={tier.featured ? 'solid' : 'outline'} className="w-full mt-auto">
                  {content.cta}
                </Button>
              </Card>
            )
          })}
        </div>
    </Section>
  )
}
