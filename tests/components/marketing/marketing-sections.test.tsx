import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { BundleTier, Testimonial } from '@designing-minds/cms'
import { BundlePricingSection } from '../../../apps/web/src/components/sections/bundle-pricing-section'
import { GradeFinderSection } from '../../../apps/web/src/components/sections/grade-finder-section'
import { TestimonialCarousel } from '../../../apps/web/src/components/sections/testimonial-carousel'
import { makeSnapshot } from '../../support/fixtures'

const inRouter = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

describe('TestimonialCarousel', () => {
  const testimonial = (id: string, quote: string): Testimonial => ({
    id, customerName: `Parent ${id}`, quote, context: 'Grade 4 parent', learnerGrade: 'Grade 4',
    sourceDate: '2026-01-01', featured: false, sortOrder: 0, published: true, status: 'published', updatedAt: '2026-01-01',
  })

  // Craig (2026-11-12): no "Read full story". Long quotes clamp at seven lines with no expand control.
  it('clamps every quote at seven lines and offers no expand button, however long the quote', () => {
    render(<TestimonialCarousel testimonials={[testimonial('long', 'More detail. '.repeat(80)), testimonial('short', 'Short and sweet.')]} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText(/Read full story|Show less/)).toBeNull()
    const quotes = document.querySelectorAll('blockquote')
    expect(quotes.length).toBeGreaterThan(0)
    for (const quote of quotes) expect(quote.classList.contains('line-clamp-7')).toBe(true)
  })
})

describe('BundlePricingSection', () => {
  const tier = (overrides: Partial<BundleTier> & Pick<BundleTier, 'scope'>): BundleTier => ({
    title: overrides.scope === 'Full Year' ? 'Full-year bundles' : 'Term bundles',
    fromPriceZar: 350, maxPriceZar: 350, gradeCount: 1, featured: overrides.scope === 'Full Year', ...overrides,
  })
  const card = (title: string) => screen.getByRole('heading', { name: title }).closest('article')!

  it('drops "From" when every bundle in a plan costs the same', () => {
    inRouter(<BundlePricingSection tiers={[tier({ scope: 'Term', fromPriceZar: 350, maxPriceZar: 350 })]} />)
    expect(within(card('Term bundles')).queryByText('From')).toBeNull()
    expect(within(card('Term bundles')).getByText('350')).toBeTruthy()
  })

  it('keeps "From" when the bundles behind a plan differ in price', () => {
    inRouter(<BundlePricingSection tiers={[tier({ scope: 'Term', fromPriceZar: 195, maxPriceZar: 250 })]} />)
    expect(within(card('Term bundles')).getByText('From')).toBeTruthy()
    expect(within(card('Term bundles')).getByText('195')).toBeTruthy()
  })

  it('decides "From" per plan', () => {
    inRouter(
      <BundlePricingSection
        tiers={[
          tier({ scope: 'Term', fromPriceZar: 195, maxPriceZar: 250 }),
          tier({ scope: 'Full Year', fromPriceZar: 1200, maxPriceZar: 1200 }),
        ]}
      />,
    )
    expect(within(card('Term bundles')).getByText('From')).toBeTruthy()
    expect(within(card('Full-year bundles')).queryByText('From')).toBeNull()
  })

  it('keeps the swirl texture on the Term card only; the featured Year card is flat brand colour', () => {
    inRouter(<BundlePricingSection tiers={[tier({ scope: 'Term' }), tier({ scope: 'Full Year' })]} />)
    const texture = '[style*="card-background-02"]'
    expect(card('Term bundles').querySelector(texture)).not.toBeNull()
    expect(card('Full-year bundles').querySelector(texture)).toBeNull()
    expect(card('Full-year bundles').className).toMatch(/\bbg-primary\b/)
    expect(within(card('Full-year bundles')).getByText('Best value')).toBeTruthy()
  })

  it('renders nothing without tiers', () => {
    const { container } = inRouter(<BundlePricingSection tiers={[]} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('GradeFinderSection', () => {
  const snapshot = makeSnapshot()

  it('shows the "Browse all resources" text link and compact phone tiles by default (Home)', () => {
    const { container } = inRouter(<GradeFinderSection snapshot={snapshot} />)
    const link = screen.getByRole('link', { name: 'Browse all resources' })
    expect(link.getAttribute('href')).toBe('/shop')
    expect(link.className).toMatch(/\btext-body-lg\b/)
    expect(link.className).not.toMatch(/\bborder\b/)
    expect(container.querySelector('.grade-grid')?.className).toBe('grade-grid grade-grid--compact')
    expect(container.querySelectorAll('a[href^="/shop?grade="]')).toHaveLength(5)
  })

  it('can drop the link and keep full tiles on phones (Grades page)', () => {
    const { container } = inRouter(<GradeFinderSection snapshot={snapshot} showBrowseAll={false} compactTiles={false} />)
    expect(screen.queryByRole('link', { name: 'Browse all resources' })).toBeNull()
    expect(container.querySelector('.grade-grid')?.className).toBe('grade-grid')
    expect(container.querySelector('.hidden.sm\\:block, .hidden.sm\\:inline')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Explore our resources' })).toBeTruthy()
    expect(container.querySelectorAll('a[href^="/shop?grade="]')).toHaveLength(5)
  })

  it('shows a notice instead of tiles while the catalogue is missing', () => {
    const { container } = inRouter(<GradeFinderSection snapshot={null} loadError="Catalogue offline" />)
    expect(screen.getByText('Grades are unavailable')).toBeTruthy()
    expect(screen.getByText('Catalogue offline')).toBeTruthy()
    expect(container.querySelector('.grade-grid')).toBeNull()
  })
})
