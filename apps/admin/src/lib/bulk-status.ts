import type { AdminCollection, AdminRecord } from '../cms/types'
import { recordStatus, type SaveStatus } from '../cms/publish-state'
import { setPath } from '../cms/record'

export async function saveSelectedStatus(
  collection: AdminCollection,
  records: AdminRecord[],
  selected: ReadonlySet<string>,
  status: SaveStatus,
  save: (collection: AdminCollection, record: AdminRecord) => Promise<AdminRecord | null>,
) {
  const field = collection.statusField
  if (!field) return { attempted: 0, updated: 0, failedIds: [] as string[] }
  let updated = 0
  const failedIds: string[] = []
  const targets = records.filter((record) => {
    if (!selected.has(record.id)) return false
    const current = recordStatus(record)
    return current !== status && !(status === 'queued' && current === 'published')
  })
  for (const record of targets) {
    if (await save(collection, setPath(record, field, status))) updated += 1
    else failedIds.push(record.id)
  }
  return { attempted: targets.length, updated, failedIds }
}
