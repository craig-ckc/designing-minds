import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), user: vi.fn(), credentials: vi.fn(), payfast: vi.fn() }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: () => ({ rpc: mocks.rpc, from: mocks.from }) }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireUser: mocks.user }))
vi.mock('../../apps/functions/src/lib/payfast.ts', () => ({ payfastCredentials: mocks.credentials, buildPayfastProcess: mocks.payfast }))
import { checkout, checkoutQuote } from '../../apps/functions/src/handlers/checkout.ts'
afterEach(() => vi.unstubAllEnvs())
const request = (body: unknown) => ({ method: 'POST', headers: {}, body })
const input = { items: [{ productSlug: 'pack' }], couponCode: 'SAVE10', acceptedTerms: true, totalZar: 1 }
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SITE_URL','https://example.com')
  vi.stubEnv('FUNCTIONS_PUBLIC_URL','https://api.example.com')
  mocks.user.mockResolvedValue({ id: 'customer' })
  mocks.credentials.mockReturnValue({ merchantId: 'merchant', merchantKey: 'key' })
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { name: 'Customer', email: 'a@example.com' }, error: null }) }) }) })
  mocks.rpc.mockResolvedValue({ data: { orderId: 'order', paymentId: 'payment', reference: 'DM-test', subtotalZar: 100, discountZar: 10, totalZar: 90 }, error: null })
  mocks.payfast.mockReturnValue({ url: 'https://payfast.example', fields: {} })
})
it('uses the atomic trusted price and forwards the code, ignoring a client-supplied total', async () => {
  const response = await checkout(request(input))
  expect(response.status).toBe(201)
  expect(mocks.rpc).toHaveBeenCalledWith('create_promotional_order', expect.objectContaining({ p_customer_id: 'customer', p_slugs: ['pack'], p_coupon_code: 'SAVE10' }))
  expect(mocks.payfast).toHaveBeenCalledWith(expect.objectContaining({ amount: '90.00', m_payment_id: 'payment' }))
})
it('quotes without creating a payment or requiring terms or merchant credentials', async () => {
  expect((await checkoutQuote(request({ items: input.items, couponCode: 'SAVE10' }))).status).toBe(200)
  expect(mocks.rpc).toHaveBeenCalledWith('quote_promotional_order', expect.objectContaining({ p_coupon_code: 'SAVE10' }))
  expect(mocks.credentials).not.toHaveBeenCalled()
  expect(mocks.payfast).not.toHaveBeenCalled()
})
it.each([12, {}, [], 'x'.repeat(41)].map((value) => [value]))('rejects a malformed code %j', async (couponCode) => {
  expect((await checkout(request({ ...input, couponCode }))).status).toBe(400)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
it('shows coupon validation errors and hides infrastructure errors', async () => {
  mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0001', message: 'You have already used this discount code.' } })
  expect(await checkout(request(input))).toMatchObject({ status: 400, body: { error: 'You have already used this discount code.' } })
  mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '08006', message: 'private infrastructure detail' } })
  expect(await checkout(request(input))).toMatchObject({ status: 500, body: { error: 'Unable to start checkout.' } })
})
it('requires authentication for price quotes', async () => {
  mocks.user.mockRejectedValue(new Error('Missing bearer token.'))
  expect((await checkoutQuote(request(input))).status).toBe(401)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
it('forwards the displayed total so a changed price cannot silently reach PayFast', async () => {
  await checkout(request({ ...input, expectedTotalZar: 90 }))
  expect(mocks.rpc).toHaveBeenCalledWith('create_promotional_order',expect.objectContaining({p_expected_total_zar:90}))
})
