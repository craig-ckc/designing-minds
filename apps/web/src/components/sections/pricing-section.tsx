import { type AccessPlanTier, priceLabel } from '@designing-minds/cms'
import { Container } from '../ui/container'
import { Eyebrow } from '../ui/eyebrow'
import { Icon } from '../ui/icon'
import { Button } from '../ui/button'
import tierContent from '../../content/pricing/access-tier-content.json'

// Tier copy is derived from the structural difference (term vs year) plus the
// shared inclusions. See docs/decisions.md.
const TIER_CONTENT = tierContent as Record<AccessPlanTier['tier'], { includes: string[]; excludes: string[]; cta: string }>

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
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {tiers.map((tier) => {
            const content = TIER_CONTENT[tier.tier]
            return (
              <article
                key={tier.tier}
                className={`flex flex-col gap-5 rounded-lg p-8 shadow-soft ${
                  tier.featured ? 'border-2 border-primary bg-primary-tint/40' : 'border border-line bg-surface'
                }`}
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
                    <span className="rounded-full bg-primary px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-white">
                      Best value
                    </span>
                  ) : null}
                </div>
                <ul className="grid gap-3">
                  {content.includes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[0.95rem] text-ink-soft">
                      <span className="mt-0.5 grid h-[20px] w-[20px] flex-none place-items-center rounded-full bg-primary text-white">
                        <span className="h-3 w-3">
                          <Icon name="check" />
                        </span>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {content.excludes.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[0.95rem] text-muted">
                      <span className="mt-0.5 h-[20px] w-[20px] flex-none text-muted">
                        <Icon name="close" />
                      </span>
                      <span className="line-through decoration-line">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button to={`/packages?plan=${tier.tier}`} variant={tier.featured ? 'solid' : 'outline'} className="w-full">
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
