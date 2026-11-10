import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ admin: vi.fn(), context: vi.fn(), rpc: vi.fn(), log: vi.fn(), deployment: vi.fn() }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireAdmin: mocks.admin }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: () => ({
  rpc: mocks.rpc,
  from: () => ({ select: () => ({ single: mocks.context }) }),
}) }))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/vercel.ts', () => ({ fetchDeploymentStatus: mocks.deployment }))

import { AuthenticationError, ForbiddenError } from '../../apps/functions/src/lib/auth-errors.ts'
import { adminRebuildWeb, resetRebuildCooldown } from '../../apps/functions/src/handlers/admin-rebuild-web.ts'
import { adminPublishStatus } from '../../apps/functions/src/handlers/admin-publish-status.ts'

const post = (body: unknown = {}) => ({ method: 'POST', body, headers: { authorization: 'Bearer local-admin' } })

beforeEach(() => {
  vi.clearAllMocks()
  resetRebuildCooldown()
  vi.stubEnv('LOCAL_COMMERCE_PREVIEW', 'true')
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:58012')
  // A configured external hook must still never be touched from preview mode.
  vi.stubEnv('VERCEL_WEB_DEPLOY_HOOK_URL', 'https://vercel.example.test/secret-hook')
  mocks.admin.mockResolvedValue({ id: 'admin' })
  mocks.context.mockResolvedValue({ data: { enabled: true, localPreview: true }, error: null })
  mocks.rpc.mockResolvedValue({ data: { promoted: 2, removed: 1 }, error: null })
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('External requests are forbidden in this test.') }))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('publishes actual local content and reports its receipt without claiming a Vercel deployment', async () => {
  const result = await adminRebuildWeb(post())
  expect(result).toMatchObject({ status: 200, body: { state: 'queued', localPreview: true, promoted: 2, removed: 1, jobId: null } })
  expect(mocks.rpc).toHaveBeenCalledWith('publish_site_content')
  const { requestedAt } = result.body as { requestedAt: string }
  const status = await adminPublishStatus(post({ since: requestedAt }))
  expect(status).toMatchObject({ status: 200, body: { state: 'ready', localPreview: true, publishedAt: requestedAt } })
  expect(status.body).not.toHaveProperty('id')
  expect(status.body).not.toHaveProperty('inspectorUrl')
  expect(fetch).not.toHaveBeenCalled()
  expect(mocks.deployment).not.toHaveBeenCalled()
})

it('never reports ready before local publication or for a later request', async () => {
  expect(await adminPublishStatus(post({ since: new Date().toISOString() }))).toMatchObject({ status: 200, body: { state: 'pending', localPreview: true } })
  await adminRebuildWeb(post())
  expect(await adminPublishStatus(post({ since: new Date(Date.now() + 60_000).toISOString() }))).toMatchObject({ status: 200, body: { state: 'pending' } })
})

it.each([
  { environment: 'production', url: 'http://127.0.0.1:58012', enabled: true, localPreview: true },
  { environment: 'development', url: 'https://remote.supabase.co', enabled: true, localPreview: true },
  { environment: 'development', url: 'http://127.0.0.1:58012', enabled: false, localPreview: true },
  { environment: 'development', url: 'http://127.0.0.1:58012', enabled: true, localPreview: false },
])('fails closed without external fallback when a local preview guard fails: %j', async ({ environment, url, enabled, localPreview }) => {
  vi.stubEnv('NODE_ENV', environment)
  vi.stubEnv('SUPABASE_URL', url)
  mocks.context.mockResolvedValue({ data: { enabled, localPreview }, error: null })
  expect(await adminRebuildWeb(post())).toMatchObject({ status: 403 })
  expect(await adminPublishStatus(post({ since: new Date().toISOString() }))).toMatchObject({ status: 403 })
  expect(mocks.rpc).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
  expect(mocks.deployment).not.toHaveBeenCalled()
})

it.each([
  [new AuthenticationError('Invalid bearer token.'), 401],
  [new ForbiddenError('Administrator access is required.'), 403],
])('checks the admin role before local context or publication', async (error, status) => {
  mocks.admin.mockRejectedValue(error)
  expect(await adminRebuildWeb(post())).toMatchObject({ status })
  expect(await adminPublishStatus(post({ since: new Date().toISOString() }))).toMatchObject({ status })
  expect(mocks.context).not.toHaveBeenCalled()
  expect(mocks.rpc).not.toHaveBeenCalled()
})

it('returns a safe error and no ready receipt when local publication fails', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'private database detail' } })
  const result = await adminRebuildWeb(post())
  expect(result.status).toBe(500)
  expect(JSON.stringify(result.body)).not.toContain('private database detail')
  expect(await adminPublishStatus(post({ since: new Date().toISOString() }))).toMatchObject({ status: 200, body: { state: 'pending' } })
  expect(fetch).not.toHaveBeenCalled()
})
