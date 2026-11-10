import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), authUser: vi.fn(), authAdmin: vi.fn(), userQuery: vi.fn(), contextQuery: vi.fn(), orderQuery: vi.fn(),
  paymentRpc: vi.fn(), payfast: vi.fn(), credentials: vi.fn(), siteUrl: vi.fn(), apiOrigin: vi.fn(), log: vi.fn(), eq: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ rpc: mocks.paymentRpc })) }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireUser: mocks.authUser, requireAdmin: mocks.authAdmin }))
vi.mock('../../apps/functions/src/lib/auth-errors.ts', () => ({ adminAuthFailure: (error: Error) => ({ status: 403, body: { error: error.message } }) }))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/payfast.ts', () => ({
  buildPayfastProcess: mocks.payfast,
  payfastCredentials: mocks.credentials,
}))
vi.mock('../../apps/functions/src/lib/origins.ts', () => ({ apiOrigin: mocks.apiOrigin, siteUrl: mocks.siteUrl }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: () => ({
  rpc: mocks.rpc,
  from: (table: string) => {
    const query = {
      select: () => query,
      single: table === 'commerce_public_context' ? mocks.contextQuery : mocks.userQuery,
      maybeSingle: mocks.orderQuery,
      eq: (column: string, value: string) => { mocks.eq(table, column, value); return query },
    }
    return query
  },
}) }))

import { adminOrderFulfillment, commerceCancel, commerceCheckout, commercePaymentSimulate, commerceQuote, simulationEnabled } from '../../apps/functions/src/handlers/commerce.ts'

const user = { id: '12345678-1234-4234-8234-123456789012' }
const orderId = '22345678-1234-4234-8234-123456789012'
const paymentId = '32345678-1234-4234-8234-123456789012'
const physicalLine = { id: '52345678-1234-4234-8234-123456789012', productSlug: 'personalised-book', variantId: '42345678-1234-4234-8234-123456789012', quantity: 1, customizations: { name: 'Luna' } }
const delivery = { recipientName: 'Luna User', phone: '0821234567', addressLine1: '1 Main Rd', suburb: 'Rosebank', city: 'Cape Town', province: 'Western Cape', postalCode: '7700', country: 'ZA' as const }
const input = { digitalSlugs: ['math-pack'], physicalItems: [physicalLine], delivery, shippingOptionId: 'standard', acceptedTerms: true, expectedTotalZar: 123 }
const quote = { items: [{ productType: 'digital' }, { productType: 'physical' }], subtotalZar: 130, discountZar: 10, shippingZar: 3, totalZar: 123, couponCode: null, hasPhysical: true, shippingOption: { id: 'standard' }, localPreview: true }
const checkout = { ...quote, orderId, paymentId, reference: 'DM-REF', reservationExpiresAt: '2026-11-10T10:00:00.000Z' }

const post = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer user-jwt' }) => ({ method: 'POST', headers, body })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('SUPABASE_SECRET_KEY', 'local-test-service-key')
  vi.stubEnv('LOCAL_COMMERCE_PREVIEW', 'true')
  mocks.authUser.mockResolvedValue(user)
  mocks.authAdmin.mockResolvedValue({ ...user, token: 'admin' })
  mocks.contextQuery.mockResolvedValue({ data: { enabled: true, localPreview: true }, error: null })
  mocks.userQuery.mockResolvedValue({ data: { name: 'Luna User', email: 'luna@example.test' }, error: null })
  mocks.orderQuery.mockResolvedValue({ data: { id: orderId, customerId: user.id, status: 'pending', paymentId, payments: [{ id: paymentId, orderId, amountZar: '123.00', status: 'pending', provider: 'Simulation' }] }, error: null })
  mocks.rpc.mockResolvedValue({ data: quote, error: null })
  mocks.paymentRpc.mockResolvedValue({ data: { orderId, fulfillmentStatus: 'shipped' }, error: null })
  mocks.credentials.mockReturnValue({ merchantId: 'merchant', merchantKey: 'key' })
  mocks.siteUrl.mockReturnValue('https://shop.example.test')
  mocks.apiOrigin.mockReturnValue('https://api.example.test')
  mocks.payfast.mockReturnValue({ url: 'https://www.payfast.co.za/eng/process', fields: { amount: '123.00' } })
})

afterEach(() => vi.unstubAllEnvs())

describe('commerce quote and checkout', () => {
  it('requires authentication before quoting and uses only server-provided customer identity', async () => {
    mocks.authUser.mockRejectedValue(new Error('Missing bearer token.'))
    expect(await commerceQuote(post({ digitalSlugs: ['math-pack'], physicalItems: [] }))).toMatchObject({ status: 401 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects malformed carts and bounds line quantities', async () => {
    expect(await commerceQuote(post({ digitalSlugs: [], physicalItems: [{ ...physicalLine, quantity: 0 }] }))).toMatchObject({ status: 400 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('quotes with trusted catalog data and ignores browser prices or customer ids', async () => {
    const response = await commerceQuote(post({ ...input, clientPriceZar: 0, customerId: 'other' }))
    expect(response).toMatchObject({ status: 200, body: quote })
    expect(mocks.rpc).toHaveBeenCalledWith('quote_commerce_order', {
      p_customer_id: user.id, p_digital_slugs: ['math-pack'], p_physical_items: [physicalLine],
      p_coupon_code: null, p_delivery: delivery, p_shipping_option_id: 'standard',
    })
  })

  it('requires the database physical-commerce setting', async () => {
    mocks.contextQuery.mockResolvedValue({ data: { enabled: false, localPreview: true }, error: null })
    expect(await commerceQuote(post({ ...input, acceptedTerms: undefined, expectedTotalZar: undefined }))).toMatchObject({ status: 403 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('validates live payment configuration before creating an order or stock hold', async () => {
    vi.stubEnv('LOCAL_COMMERCE_PREVIEW', 'false')
    mocks.contextQuery.mockResolvedValue({ data: { enabled: true, localPreview: false }, error: null })
    mocks.credentials.mockImplementation(() => { throw new Error('missing PayFast') })
    expect(await commerceCheckout(post(input))).toMatchObject({ status: 500 })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.userQuery).not.toHaveBeenCalled()
  })

  it('creates a local pending order without contacting PayFast only under the complete safe guard', async () => {
    mocks.rpc.mockResolvedValue({ data: checkout, error: null })
    const response = await commerceCheckout(post(input))
    expect(response).toMatchObject({ status: 201, body: { ...checkout, simulation: true } })
    expect(mocks.rpc).toHaveBeenCalledWith('create_commerce_order', expect.objectContaining({ p_customer_id: user.id, p_expected_total_zar: 123 }))
    expect(mocks.credentials).not.toHaveBeenCalled()
    expect(mocks.payfast).not.toHaveBeenCalled()
    expect(mocks.userQuery).not.toHaveBeenCalled()
  })

  it('never enables simulation for production, remote URLs, missing env flag, or disabled DB context', () => {
    expect(simulationEnabled({ enabled: true, localPreview: true }, { NODE_ENV: 'production', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'http://localhost:54321' })).toBe(false)
    expect(simulationEnabled({ enabled: true, localPreview: true }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'https://project.supabase.co' })).toBe(false)
    expect(simulationEnabled({ enabled: true, localPreview: true }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: '1', SUPABASE_URL: 'http://127.0.0.1:54321' })).toBe(false)
    expect(simulationEnabled({ enabled: false, localPreview: true }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'http://127.0.0.1:54321' })).toBe(false)
    expect(simulationEnabled({ enabled: true, localPreview: false }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'http://127.0.0.1:54321' })).toBe(false)
    expect(simulationEnabled({ enabled: true, localPreview: true }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'http://localhost.example.test:54321' })).toBe(false)
    expect(simulationEnabled({ enabled: true, localPreview: true }, { NODE_ENV: 'development', LOCAL_COMMERCE_PREVIEW: 'true', SUPABASE_URL: 'http://[::1]:54321' })).toBe(true)
  })

  it('does not fall back to a real payment when preview configuration is incomplete', async () => {
    vi.stubEnv('LOCAL_COMMERCE_PREVIEW', 'false')
    expect(await commerceCheckout(post(input))).toMatchObject({ status: 403 })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.credentials).not.toHaveBeenCalled()
    expect(mocks.payfast).not.toHaveBeenCalled()
  })

  it.each([0, -1, 1.5, 2_147_483_648])('rejects invalid quantity %s before calling SQL', async (quantity) => {
    expect(await commerceQuote(post({ ...input, physicalItems: [{ ...physicalLine, quantity }] }))).toMatchObject({ status: 400 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it.each([
    { acceptedTerms: false }, { acceptedTerms: undefined }, { expectedTotalZar: 0 },
    { expectedTotalZar: Number.NaN }, { expectedTotalZar: Number.POSITIVE_INFINITY },
  ])('requires accepted terms and a valid expected total: %j', async (patch) => {
    expect(await commerceCheckout(post({ ...input, ...patch }))).toMatchObject({ status: 400 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects missing delivery only at physical checkout and lets quotes omit it', async () => {
    expect(await commerceQuote(post({ ...input, delivery: null }))).toMatchObject({ status: 200 })
    mocks.rpc.mockClear()
    expect(await commerceCheckout(post({ ...input, delivery: null }))).toMatchObject({ status: 400 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('returns database stock and price changes as actionable client errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'Prices changed. Review the updated total before paying.' } })
    expect(await commerceCheckout(post(input))).toMatchObject({ status: 400, body: { error: 'Prices changed. Review the updated total before paying.' } })
  })
})

describe('local payment simulation', () => {
  it('is invisible outside local preview, even with an authorization header', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 404 })
    expect(mocks.authUser).not.toHaveBeenCalled()
  })

  it('completes only the authenticated owner order using its stored amount and a deterministic local provider id', async () => {
    mocks.rpc.mockResolvedValue({ data: 'processed', error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded', amountZar: 0, providerPaymentId: 'forged' }))).toMatchObject({ status: 200, body: { outcome: 'succeeded', status: 'paid', orderId } })
    expect(mocks.rpc).toHaveBeenCalledWith('complete_commerce_payment', { p_payment_id: paymentId, p_provider_payment_id: `LOCAL-SIM-${paymentId}`, p_amount_zar: '123.00' })
    expect(mocks.eq).toHaveBeenCalledWith('orders', 'customerId', user.id)
  })

  it('reports delayed stock allocation for a verified payment without treating it as paid fulfillment', async () => {
    mocks.rpc.mockResolvedValue({ data: 'review', error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 200, body: { status: 'payment_review' } })
  })

  it('cannot simulate an order belonging to another customer', async () => {
    mocks.orderQuery.mockResolvedValue({ data: null, error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 404 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('routes failed and cancelled outcomes through the same owner-scoped, idempotent cancel RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'failed' }))).toMatchObject({ status: 200, body: { status: 'cancelled' } })
    expect(mocks.rpc).toHaveBeenCalledWith('cancel_commerce_order', { p_customer_id: user.id, p_order_id: orderId })
  })

  it('returns review on duplicate success without inventing a second provider id', async () => {
    mocks.rpc.mockResolvedValue({ data: 'duplicate', error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 200, body: { status: 'paid' } })
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })

  it('does not complete a provider payment or an unlinked payment through the simulation endpoint', async () => {
    mocks.orderQuery.mockResolvedValue({ data: { id: orderId, customerId: user.id, status: 'pending', paymentId, payments: [{ id: paymentId, orderId, provider: 'PayFast', status: 'pending', amountZar: 123 }] }, error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 404 })
    expect(mocks.rpc).not.toHaveBeenCalled()
    mocks.orderQuery.mockResolvedValue({ data: { id: orderId, customerId: user.id, status: 'pending', paymentId: 'different', payments: [{ id: paymentId, orderId, provider: 'Simulation', status: 'pending', amountZar: 123 }] }, error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 404 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('reports payment review on a retry without falsely claiming the order is paid', async () => {
    mocks.orderQuery.mockResolvedValue({ data: { id: orderId, customerId: user.id, status: 'payment_review', paymentId, payments: [{ id: paymentId, orderId, amountZar: 123, status: 'succeeded', provider: 'Simulation' }] }, error: null })
    mocks.rpc.mockResolvedValue({ data: 'duplicate', error: null })
    expect(await commercePaymentSimulate(post({ orderId, outcome: 'succeeded' }))).toMatchObject({ status: 200, body: { status: 'payment_review' } })
  })

  it('rejects malformed simulation orders without querying customer data', async () => {
    expect(await commercePaymentSimulate(post({ orderId: 'not-a-uuid', outcome: 'succeeded' }))).toMatchObject({ status: 400 })
    expect(mocks.orderQuery).not.toHaveBeenCalled()
  })
})

describe('cancel and admin fulfillment', () => {
  it('passes only the authenticated customer id to cancellation', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    expect(await commerceCancel(post({ orderId, customerId: 'forged' }))).toMatchObject({ status: 200 })
    expect(mocks.rpc).toHaveBeenCalledWith('cancel_commerce_order', { p_customer_id: user.id, p_order_id: orderId })
  })

  it('checks admin authorization before changing fulfillment', async () => {
    mocks.authAdmin.mockRejectedValue(new Error('Administrator access is required.'))
    expect(await adminOrderFulfillment(post({ orderId, status: 'shipped' }))).toMatchObject({ status: 403 })
    expect(mocks.paymentRpc).not.toHaveBeenCalled()
  })

  it('passes the admin JWT to the database authorization check', async () => {
    expect(await adminOrderFulfillment(post({ orderId, status: 'shipped', trackingNumber: 'TRACK-1', trackingUrl: 'https://carrier.example.test/TRACK-1' }))).toMatchObject({ status: 200 })
    expect(createClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({
      global: { headers: { Authorization: 'Bearer user-jwt' } },
    }))
    expect(mocks.paymentRpc).toHaveBeenCalledWith('set_order_fulfillment', { p_order_id: orderId, p_status: 'shipped', p_tracking_number: 'TRACK-1', p_tracking_url: 'https://carrier.example.test/TRACK-1' })
  })

  it('rejects manual review and unfulfilled transitions at the API boundary', async () => {
    for (const status of ['review', 'unfulfilled']) {
      expect(await adminOrderFulfillment(post({ orderId, status }))).toMatchObject({ status: 400 })
    }
    expect(mocks.authAdmin).not.toHaveBeenCalled()
    expect(mocks.paymentRpc).not.toHaveBeenCalled()
  })
})
