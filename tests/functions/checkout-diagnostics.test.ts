import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ log: vi.fn(), client: vi.fn(), credentials: vi.fn(), user: vi.fn() }))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: mocks.client }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireUser: mocks.user }))
vi.mock('../../apps/functions/src/lib/payfast.ts', () => ({ payfastCredentials: mocks.credentials, buildPayfastProcess: vi.fn() }))
import { checkout } from '../../apps/functions/src/handlers/checkout.ts'

beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: crypto.randomUUID() }) })
it('validates payment configuration before writing an order and records the failing stage', async () => {
  vi.stubEnv('SITE_URL', 'https://www.designingminds.co.za')
  mocks.credentials.mockImplementation(() => { throw new Error('Missing merchant credentials') })
  const result = await checkout({ method: 'POST', headers: {}, body: { items: [{ productSlug: 'test' }], acceptedTerms: true } })
  expect(result.status).toBe(500)
  expect(mocks.client).not.toHaveBeenCalled()
  expect(mocks.log).toHaveBeenCalledWith('checkout.configuration')
  expect(mocks.log).toHaveBeenCalledWith('checkout.failed', expect.any(Object))
  vi.unstubAllEnvs()
})
