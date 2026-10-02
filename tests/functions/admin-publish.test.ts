import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ log: vi.fn(), client: vi.fn(), admin: vi.fn(), rpc: vi.fn() }))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: mocks.client }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireAdmin: mocks.admin }))

import { adminRebuildWeb, resetRebuildCooldown } from '../../apps/functions/src/handlers/admin-rebuild-web.ts'
import { adminPublishStatus } from '../../apps/functions/src/handlers/admin-publish-status.ts'
import { fetchDeploymentStatus, mapVercelState } from '../../apps/functions/src/lib/vercel.ts'

const post = (body?: unknown) => ({ method: 'POST', headers: {}, body })
const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_test/hook'

beforeEach(() => {
  vi.clearAllMocks()
  resetRebuildCooldown()
  mocks.admin.mockResolvedValue({ id: 'admin' })
  mocks.client.mockReturnValue({ rpc: mocks.rpc })
  mocks.rpc.mockResolvedValue({ data: { promoted: 2, removed: 1 }, error: null })
  vi.stubEnv('VERCEL_WEB_DEPLOY_HOOK_URL', HOOK)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('POST /admin/rebuild-web', () => {
  it('promotes queued content BEFORE triggering the build', async () => {
    const order: string[] = []
    mocks.rpc.mockImplementation(async () => {
      order.push('promote')
      return { data: { promoted: 2, removed: 1 }, error: null }
    })
    vi.stubGlobal('fetch', vi.fn(async () => {
      order.push('hook')
      return new Response(JSON.stringify({ job: { id: 'job_1', state: 'PENDING' } }))
    }))

    const result = await adminRebuildWeb(post())
    expect(order).toEqual(['promote', 'hook'])
    expect(mocks.rpc).toHaveBeenCalledWith('publish_site_content')
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ state: 'queued', promoted: 2, removed: 1, jobId: 'job_1' })
    expect(Number.isNaN(Date.parse((result.body as { requestedAt: string }).requestedAt))).toBe(false)
  })

  it('does not start a build when the promotion fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const hook = vi.fn()
    vi.stubGlobal('fetch', hook)

    const result = await adminRebuildWeb(post())
    expect(result.status).toBe(500)
    expect(hook).not.toHaveBeenCalled()
    expect(mocks.log).toHaveBeenCalledWith('admin.publish.failed', expect.any(Object))
  })

  it('says the content is live but the pages are not when the hook fails, and allows a retry', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    const failed = await adminRebuildWeb(post())
    expect(failed.status).toBe(500)
    expect((failed.body as { error: string }).error).toMatch(/Publish again/)

    // The failed attempt must not arm the cooldown, or the retry is refused.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
    expect((await adminRebuildWeb(post())).body).toMatchObject({ state: 'queued' })
  })

  it('debounces a second publish inside the cooldown without promoting anything', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
    await adminRebuildWeb(post())
    mocks.rpc.mockClear()

    const again = await adminRebuildWeb(post())
    expect(again.body).toMatchObject({ state: 'debounced' })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('refuses non-admins before touching the database', async () => {
    mocks.admin.mockRejectedValue(new Error('Administrator access is required.'))
    const result = await adminRebuildWeb(post())
    expect(result.status).toBe(401)
    expect(mocks.client).not.toHaveBeenCalled()
  })
})

describe('POST /admin/publish-status', () => {
  it('requires an ISO `since`', async () => {
    expect((await adminPublishStatus(post({ since: 'yesterday' }))).status).toBe(400)
    expect((await adminPublishStatus(post())).status).toBe(400)
  })

  it('reports unconfigured when no Vercel token is set', async () => {
    vi.stubEnv('VERCEL_API_TOKEN', '')
    const result = await adminPublishStatus(post({ since: new Date().toISOString() }))
    expect(result.body).toEqual({ state: 'unconfigured' })
  })

  it('refuses non-admins', async () => {
    mocks.admin.mockRejectedValue(new Error('nope'))
    expect((await adminPublishStatus(post({ since: new Date().toISOString() }))).status).toBe(401)
  })
})

describe('fetchDeploymentStatus', () => {
  const env = { VERCEL_API_TOKEN: 'tok', VERCEL_WEB_PROJECT_ID: 'prj_web', VERCEL_TEAM_ID: 'team_x' }
  const since = Date.parse('2026-10-01T10:00:00Z')
  const respond = (deployments: unknown[]) => vi.fn(async () => new Response(JSON.stringify({ deployments }))) as unknown as typeof fetch

  it('maps Vercel states to the words an editor sees', () => {
    expect(mapVercelState('QUEUED')).toBe('queued')
    expect(mapVercelState('INITIALIZING')).toBe('queued')
    expect(mapVercelState('BUILDING')).toBe('building')
    expect(mapVercelState('READY')).toBe('ready')
    expect(mapVercelState('ERROR')).toBe('error')
    expect(mapVercelState('CANCELED')).toBe('canceled')
    expect(mapVercelState(undefined)).toBe('pending')
  })

  it('picks the newest production deployment created since the publish', async () => {
    const fetchImpl = respond([
      { uid: 'dpl_old', readyState: 'READY', created: since - 60_000 },
      { uid: 'dpl_new', readyState: 'BUILDING', created: since + 4_000, inspectorUrl: 'https://vercel.com/x' },
    ])
    expect(await fetchDeploymentStatus(since, fetchImpl, env)).toMatchObject({
      state: 'building',
      id: 'dpl_new',
      inspectorUrl: 'https://vercel.com/x',
    })
    const url = String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(url).toContain('projectId=prj_web')
    expect(url).toContain('target=production')
    expect(url).toContain('teamId=team_x')
  })

  it('tolerates a few seconds of clock skew between us and Vercel', async () => {
    expect((await fetchDeploymentStatus(since, respond([{ uid: 'd', readyState: 'QUEUED', created: since - 3_000 }]), env)).state).toBe('queued')
  })

  it('is pending until Vercel has created the deployment', async () => {
    expect((await fetchDeploymentStatus(since, respond([{ uid: 'old', readyState: 'READY', created: since - 120_000 }]), env)).state).toBe('pending')
  })

  it('surfaces a failed build', async () => {
    expect((await fetchDeploymentStatus(since, respond([{ uid: 'd', readyState: 'ERROR', created: since + 1 }]), env)).state).toBe('error')
  })

  it('throws on an API error so the handler can report it', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 })) as unknown as typeof fetch
    await expect(fetchDeploymentStatus(since, fetchImpl, env)).rejects.toThrow(/403/)
  })
})
