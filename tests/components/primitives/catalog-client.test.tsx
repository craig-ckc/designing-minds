import { expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { makeSnapshot } from '../../support/fixtures'

const mocks = vi.hoisted(() => ({ create: vi.fn(), sanitize: vi.fn() }))
vi.mock('@designing-minds/cms', () => ({ createCmsRepository: mocks.create, toPublicSnapshot: mocks.sanitize }))
import { loadPublicBuildData } from '../../../apps/web/src/build/load-public-data'

it('reuses an injected browser client while keeping the public audience and sanitization boundary', async () => {
  const client = {} as SupabaseClient
  const full = makeSnapshot({ customers: [{ id: 'private', email: 'private@example.com', name: 'Private', createdAt: '2026-01-01' }] })
  const publicSnapshot = makeSnapshot()
  mocks.create.mockReturnValue({ getSnapshot: async () => full, getSlugRedirects: async () => [] })
  mocks.sanitize.mockReturnValue(publicSnapshot)
  const result = await loadPublicBuildData({ supabaseClient: client })
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ audience: 'public', supabaseClient: client }))
  expect(mocks.sanitize).toHaveBeenCalledWith(full)
  expect(result.snapshot).toBe(publicSnapshot)
})
