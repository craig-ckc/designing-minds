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
    excludes: ['Other terms are available separately'],
    cta: 'Browse term bundles',
  },
  'Full Year': {
    label: 'Full year',
    tagline: 'One grade, all four terms in one bundle.',
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

/** "From" shows only when the bundles behind a plan differ in price, so an equal-price plan reads
 *  as one exact price, as in Figma, and a mixed one stays truthful. */
const pricesVary = (tier: BundleTier) => tier.maxPriceZar !== tier.fromPriceZar

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
 *  no shadows, in keeping with the flat, border-led design system. The featured (full-year)
 *  card is flat brand pink; the term card keeps the soft swirl texture. */
export function BundlePricingSection({ tiers }: { tiers: BundleTier[] }) {
  if (tiers.length === 0) return null
  return (
    <Section id="bundles" aria-labelledby="bundles-heading" className="scroll-mt-[var(--header-h)]">
      <div className="mb-8 max-w-xl lg:mb-10">
        <h2 id="bundles-heading">Save with a term or full-year bundle</h2>
        <p className="mt-4 max-w-[50ch] lead">
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
                'flex flex-col overflow-hidden rounded-2xl relative isolate',
                featured ? 'bg-primary' : 'border border-line',
                // Featured card leads on mobile; restores its column order from md up.
                featured && 'order-first md:order-none',
              )}
            >
              {featured ? null : (
                <div
                  className="absolute inset-0 -z-1 bg-cover bg-center opacity-50 mix-blend-soft-light"
                  style={{ backgroundImage: "url('/images/card-background-02.svg')" }}
                  aria-hidden
                />
              )}

              {/* White island — the nested offer/price/CTA card. */}
              <div className="p-2">
                <div className="flex flex-col gap-5 rounded-sm border border-line bg-canvas p-6">
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

                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {pricesVary(tier) ? <span className="text-body text-muted">From</span> : null}
                    <span className="text-body-lg font-semibold text-ink-soft">{symbol}</span>
                    <strong className="text-display text-primary">{number}</strong>
                    <span className="text-body text-muted">once-off · per {periodLabel(tier.scope)}</span>
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
              <div className="grid gap-x-6 gap-y-3 px-4 pb-6 sm:grid-cols-2">
                {content.includes.map((feature) => (
                  <div key={feature} className={cn('flex gap-2 text-body', featured ? 'text-on-primary' : 'text-ink-soft')} >
                    <span
                      className={cn(
                        'mt-px grid size-5 flex-none place-items-center rounded-full',
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
                    className={cn('flex gap-2 text-body', featured ? 'text-on-primary' : 'text-muted')}
                  >
                    <span className="mt-px grid size-5 flex-none place-items-center">
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
