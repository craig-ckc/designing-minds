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
  it('sets the intro in 16px muted and the support link as a soft TextLink (not a bare link)', () => {
    at('/login', <AuthLayout title="Welcome back" intro="Log in to see your orders." footer={null}><span /></AuthLayout>)
    expect(screen.getByText('Log in to see your orders.').className).toMatch(/\btext-body-lg\b.*\btext-muted\b/)
    const support = screen.getByRole('link', { name: 'Visit support' })
    expect(support.className).toContain('text-ink-soft')
    expect(support.className).toContain('underline')
  })
  it('drops the intro paragraph when no intro is given (email-sent state)', () => {
    const { container } = at('/forgot-password', <AuthLayout title="Check your email" footer={null}><span /></AuthLayout>)
    const header = screen.getByRole('heading', { level: 1 }).parentElement!
    expect(header.children).toHaveLength(1)
    expect(container.querySelector('.auth-card > div:first-child > p')).toBeNull()
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
    // Figma sets the label as a 12px uppercase micro label with no extra tracking.
    const label = screen.getByText('Location').className
    expect(label).toMatch(/\btext-caption\b.*\buppercase\b.*\btext-muted\b/)
    expect(label).not.toMatch(/tracking-/)
    // Actions are 14px semibold underlined brand links.
    const call = screen.getByRole('link', { name: 'Call' }).className
    for (const cls of ['text-body', 'font-semibold', 'text-primary-ink', 'underline']) expect(call).toContain(cls)
    // Rows carry no side padding: the panel's padding insets the dividers.
    expect(screen.getByText('Phone').closest('.border-b')!.className).not.toMatch(/\bpx-/)
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
  const two = [
    { id: 'f1', question: 'First?', answer: 'First answer.', category: 'x', sortOrder: 1, published: true },
    { id: 'f2', question: 'Second?', answer: 'Second answer.', category: 'x', sortOrder: 2, published: true },
  ] as unknown as Faq[]
  it('starts fully collapsed by default', () => {
    render(<FaqAccordion faqs={two} />)
    expect(screen.queryByText('First answer.')).toBeNull()
    expect(screen.queryByText('Second answer.')).toBeNull()
    for (const trigger of screen.getAllByRole('button')) expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
  it('opens only the first question with defaultOpenFirst', () => {
    render(<FaqAccordion faqs={two} defaultOpenFirst />)
    expect(screen.getByText('First answer.')).toBeTruthy()
    expect(screen.queryByText('Second answer.')).toBeNull()
    expect(screen.getByRole('button', { name: 'First?' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Second?' }).getAttribute('aria-expanded')).toBe('false')
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
  it('uses the H1 title, the lead paragraph and outline-only suggestion links', () => {
    at('/nope', <NotFoundPage />)
    expect(screen.getByRole('heading', { level: 1 }).className).toContain('text-h1')
    expect(screen.getByText(/doesn’t exist or may have moved/).className).toContain('lead')
    const suggestion = document.querySelector('a[href="/shop"]')!
    expect(suggestion.className).toContain('border-line')
    expect(suggestion.className).not.toMatch(/\bbg-/)
  })
})
