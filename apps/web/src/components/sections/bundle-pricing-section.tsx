import { priceLabel, type BundleTier } from '@designing-minds/cms'
import { cn } from '@designing-minds/utils'
import { Section } from '../ui/section'
import { Icon } from '../ui/icon'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Pill } from '../ui/pill'

const TIER_CONTENT: Record<
  BundleTier['scope'],
  { label: string; tagline: string; includes: string[]; excludes: string[]; cta: string }
> = {
  Term: {
    label: 'One term',
    tagline: 'Everything for a single grade and term.',
    includes: [
      'All available tests for one grade and term',
      'Multiple subjects in one bundle',
      'Tests and memorandums together',
      'Instant download on your order page',
    ],
    excludes: ['Other terms — available separately'],
    cta: 'Browse term bundles',
  },
  'Full Year': {
    label: 'Full year',
    tagline: 'One grade, all four terms — our best value.',
    includes: [
      'All available tests for one grade',
      'All four school terms',
      'Multiple subjects in one bundle',
      'Tests and memorandums together',
      'Instant download on your order page',
    ],
    excludes: [],
    cta: 'Browse full-year bundles',
  },
}

const periodLabel = (scope: BundleTier['scope']) => (scope === 'Full Year' ? 'full year' : 'term')

/** Split the localised price ("R 1 200") into its currency symbol and number so
 *  the amount can read large with a small leading symbol. */
function splitPrice(amount: number) {
  const text = priceLabel(amount)
  const number = text.replace(/^\D+/, '').trim()
  const symbol = text.slice(0, text.length - number.length).trim() || 'R'
  return { symbol, number }
}

/** Published bundle comparison. Each card deep-links to its matching package filter.
 *  Depth comes from a white "island" holding the offer, nested in the outer card —
 *  no shadows, in keeping with the flat, border-led design system. */
export function BundlePricingSection({ tiers }: { tiers: BundleTier[] }) {
  if (tiers.length === 0) return null
  return (
    <Section id="bundles">
      <div className="mx-auto mb-9 max-w-prose text-center lg:mb-14">
        <h2>Save with a term or full-year bundle</h2>
        <p className="mt-4 lead">
          Get all the available tests and memorandums for a grade together in one discounted, once-off purchase.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {tiers.map((tier) => {
          const content = TIER_CONTENT[tier.scope]
          const offer = tier.scope === 'Full Year' ? 'Full-year bundles' : 'Term bundles'
          const { symbol, number } = splitPrice(tier.fromPriceZar)
          const featured = tier.featured
          return (
            <Card
              as="article"
              key={tier.scope}
              variant="surface"
              pad="none"
              className={cn(
                'flex flex-col overflow-hidden rounded-panel relative isolate',
                featured ? '[background-image:var(--gradient-primary)]' : 'border border-line',
                // Featured card leads on mobile; restores its column order from md up.
                featured && 'order-first md:order-none',
              )}
            >
              <div className='absolute inset-0 -z-1 mix-blend-soft-light' >
                <img src="/images/card-background-02.svg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              </div>

              {/* White island — the nested offer/price/CTA card. */}
              <div className="p-3">
                <div className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-6 lg:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">
                      {content.label}
                    </span>
                    {featured ? (
                      <Pill tone="primary" size="sm" className="px-3 font-bold uppercase tracking-[0.06em]">
                        Best value
                      </Pill>
                    ) : null}
                  </div>

                  <div>
                    <h3>{tier.title}</h3>
                    <p className="mt-1 text-body text-muted">{content.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-body-lg font-bold text-ink-soft">{symbol}</span>
                    <strong className="text-display text-primary">{number}</strong>
                    <span className="text-body-sm text-muted">once-off · per {periodLabel(tier.scope)}</span>
                  </div>

                  <Button
                    to={`/packages?offer=${encodeURIComponent(offer)}`}
                    variant={featured ? 'solid' : 'outline'}
                    className="w-full"
                  >
                    {content.cta}
                  </Button>
                </div>
              </div>

              {/* Features sit on the outer surface, below the island. */}
              <div className="grid gap-x-6 gap-y-3.5 px-6 pb-7 sm:grid-cols-2 lg:px-7">
                {content.includes.map((feature) => (
                  <div key={feature} className={cn('flex gap-2.5 text-body-sm', featured ? 'text-on-primary/90' : 'text-ink-soft')} >
                    <span
                      className={cn(
                        'mt-px grid h-[20px] w-[20px] flex-none place-items-center rounded-pill',
                        featured ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary',
                      )}
                    >
                      <span className="h-3 w-3">
                        <Icon name="check" />
                      </span>
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
                {content.excludes.map((feature) => (
                  <div
                    key={feature}
                    className={cn('flex gap-2.5 text-body-sm', featured ? 'text-on-primary/60' : 'text-muted')}
                  >
                    <span className="mt-px grid h-[20px] w-[20px] flex-none place-items-center">
                      <Icon name="close" />
                    </span>
                    <span className="decoration-line">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}
