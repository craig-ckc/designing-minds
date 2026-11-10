import { describe, expect, it, vi } from 'vitest'
import { collectionRegistry } from '../../../apps/admin/src/cms/registry'
import { saveSelectedStatus } from '../../../apps/admin/src/lib/bulk-status'

describe('bulk status save summary inputs', () => {
  it('continues after a failed save and returns accurate partial outcome', async () => {
    const collection = collectionRegistry.find((entry) => entry.id === 'products')!
    const records = [
      { id: 'a', title: 'A', slug: 'a', status: 'draft' },
      { id: 'b', title: 'B', slug: 'b', status: 'draft' },
      { id: 'c', title: 'C', slug: 'c', status: 'draft' },
    ]
    const save = vi.fn(async (_collection, record) => record.id === 'b' ? null : record)
    const result = await saveSelectedStatus(collection, records, new Set(['a', 'b', 'c']), 'queued', save)
    expect(result).toEqual({ attempted: 3, updated: 2, failedIds: ['b'] })
    expect(save).toHaveBeenCalledTimes(3)
  })
})
