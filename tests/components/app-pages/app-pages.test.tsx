import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Faq, Order } from '@designing-minds/cms'
import { AuthLayout } from '../../../apps/web/src/pages/auth/auth-layout'
import { AccountTabs } from '../../../apps/web/src/pages/account/account-tabs'
import { OrderRow } from '../../../apps/web/src/pages/account/order-row'
import { summariseOrders } from '../../../apps/web/src/pages/account/account-summary'
import { ContactDetail } from '../../../apps/web/src/components/ui/contact-detail'
import { FaqAccordion } from '../../../apps/web/src/components/ui/faq-accordion'
import { NotFoundPage } from '../../../apps/web/src/pages/not-found-page'

const at = (route: string, node: React.ReactNode) => render(<MemoryRouter initialEntries={[route]}>{node}</MemoryRouter>)
const order = (o: Partial<Order>) => ({ id: 'o1', reference: 'DM-1', placedAt: '2026-11-04T10:00:00Z', items: [{}, {}], status: 'paid', totalZar: 100, ...o }) as unknown as Order

describe('AuthLayout', () => {
  it('renders the painted backdrop and one card with the form, footer and support link', () => {
    const { container } = at('/login', <AuthLayout title="Welcome back" intro="Lead" footer={<a href="/sign-up">Create an account</a>}><input name="email" /></AuthLayout>)
    const img = container.querySelector('img.auth-stage__backdrop')!
    expect(img.getAttribute('src')).toBe('/images/paintings/auth-hills-wildflowers.avif')
    expect(img.getAttribute('alt')).toBe('')
    expect(img.getAttribute('width')).toBe('1536')
    expect(container.querySelectorAll('.auth-card')).toHaveLength(1)
    expect(container.querySelector('.resource-stack')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Welcome back')
    expect(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href')).toBe('/sign-up')
    expect(screen.getByRole('link', { name: 'Visit support' }).getAttribute('href')).toBe('/help')
    expect(container.querySelector('form input[name="email"]')).toBeTruthy()
    expect(screen.queryByText('Return to checkout')).toBeNull()
  })
  it('keeps the checkout context', () => {
    at('/login?redirect=%2Fcheckout', <AuthLayout title="t" intro="i" footer={null}><span /></AuthLayout>)
    expect(screen.getByText(/You need an account to complete checkout/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Return to checkout' }).getAttribute('href')).toBe('/checkout')
  })
})

describe('AccountTabs', () => {
  const active = () => screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page').map((l) => l.textContent)
  it('marks Dashboard active only on /account', () => {
    at('/account', <AccountTabs />)
    expect(active()).toEqual(['Dashboard'])
  })
  it('marks Order history active on the list and on an order detail', () => {
    at('/account/orders/abc', <AccountTabs />)
    expect(active()).toEqual(['Order history'])
    expect(screen.getByRole('link', { name: 'Support' }).getAttribute('href')).toBe('/help')
  })
  it('underlines the active tab in primary', () => {
    at('/account/orders', <AccountTabs />)
    expect(screen.getByRole('link', { name: 'Order history' }).className).toContain('border-primary')
    expect(screen.getByRole('link', { name: 'Dashboard' }).className).toContain('border-transparent')
  })
})

describe('summariseOrders', () => {
  it('sums lifetime spend over paid and fulfilled orders only', () => {
    const s = summariseOrders([
      order({ status: 'paid', totalZar: 100 }), order({ status: 'fulfilled', totalZar: 250 }),
      order({ status: 'pending', totalZar: 85 }), order({ status: 'failed', totalZar: 40 }),
      order({ status: 'refunded', totalZar: 500 }), order({ status: 'payment_review', totalZar: 70 }),
    ])
    expect(s).toEqual({ totalOrders: 6, readyToDownload: 2, lifetimeSpendZar: 350 })
  })
  it('is zero for no orders', () => {
    expect(summariseOrders([])).toEqual({ totalOrders: 0, readyToDownload: 0, lifetimeSpendZar: 0 })
  })
})

describe('OrderRow', () => {
  it('shows reference, date · items, status, total and links to the order', () => {
    at('/', <OrderRow order={order({ id: 'xyz', items: [{}] as Order['items'] })} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/account/orders/xyz')
    expect(within(link).getByText('DM-1')).toBeTruthy()
    expect(within(link).getByText('4 Nov 2026 · 1 item')).toBeTruthy()
    expect(within(link).getByText('paid')).toBeTruthy()
  })
  it('pluralises items', () => {
    at('/', <OrderRow order={order({})} />)
    expect(screen.getByText('4 Nov 2026 · 2 items')).toBeTruthy()
  })
})

describe('ContactDetail', () => {
  it('renders an action link only when given one', () => {
    render(<div>
      <ContactDetail label="Phone" value="+27 84 605 5217" action={{ label: 'Call', href: 'tel:+27846055217' }} />
      <ContactDetail label="Email" value="a@b.co" action={{ label: 'Write', href: 'mailto:a@b.co' }} />
      <ContactDetail label="Location" value="Port Elizabeth" />
    </div>)
    expect(screen.getByRole('link', { name: 'Call' }).getAttribute('href')).toBe('tel:+27846055217')
    expect(screen.getByRole('link', { name: 'Write' }).getAttribute('href')).toBe('mailto:a@b.co')
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByText('Port Elizabeth').className).toContain('text-h6')
    // Figma sets the label as an uppercase micro label (same treatment as the footer column titles).
    expect(screen.getByText('Location').className).toMatch(/\buppercase\b.*tracking-\[0\.1em\]/)
  })
})

describe('FaqAccordion', () => {
  it('sets questions in regular weight body-lg and answers in body', () => {
    const faqs = [{ id: 'f1', question: 'Can I print?', answer: 'Yes.', category: 'x', sortOrder: 1, published: true }] as unknown as Faq[]
    render(<FaqAccordion faqs={faqs} keepMounted />)
    const q = screen.getByText('Can I print?')
    expect(q.className).toContain('text-body-lg')
    expect(q.className).toContain('font-normal')
    expect(q.className).not.toContain('font-semibold')
    expect(screen.getByText('Yes.').className).toContain('text-body')
  })
})

describe('NotFoundPage', () => {
  it('offers the four suggestions with descriptions', () => {
    at('/nope', <NotFoundPage />)
    const hrefs = ['/shop', '/packages', '/grades', '/help']
    for (const href of hrefs) expect(document.querySelector(`a[href="${href}"]`)).toBeTruthy()
    expect(screen.getByText('Browse the full CAPS-aligned catalogue')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/')
  })
})
