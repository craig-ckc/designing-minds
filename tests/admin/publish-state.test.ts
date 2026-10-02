import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canSaveAs,
  countPendingPublish,
  needsPublish,
  needsRebuild,
  publishState,
  publishStateHint,
  recordStatus,
  SAVE_CHOICES,
  type SiteStatus,
} from '../../apps/admin/src/cms/publish-state.ts'
import type { AdminRecord } from '../../apps/admin/src/cms/types.ts'

/* The rules every status word in the admin comes from (table, editor header,
   Publish button). See apps/admin/src/cms/publish-state.ts. */

const BUILT = '2026-10-01T10:00:00.000Z'
const site: SiteStatus = { build: { contentAt: BUILT, builtAt: BUILT } }
const unknownSite: SiteStatus = { build: null }

const record = (fields: Partial<AdminRecord> = {}): AdminRecord => ({
  id: 'r1',
  status: 'draft',
  published: false,
  publishedAt: null,
  ...fields,
})

test('an unknown or missing status reads as Draft — never as live', () => {
  assert.equal(recordStatus(record({ status: undefined })), 'draft')
  assert.equal(recordStatus(record({ status: 'live' })), 'draft')
  assert.equal(recordStatus(record({ status: 'queued' })), 'queued')
})

test('Queued and Archived-but-live records are what the next publish changes', () => {
  assert.equal(needsPublish(record({ status: 'queued' })), true)
  assert.equal(needsPublish(record({ status: 'archived', published: true })), true)
  // Already off the site: archiving again changes nothing.
  assert.equal(needsPublish(record({ status: 'archived', published: false })), false)
  // A Draft is held back on purpose, even when it differs from the live copy.
  assert.equal(needsPublish(record({ status: 'draft', published: true })), false)
  assert.equal(needsPublish(record({ status: 'published', published: true })), false)

  const pending = [
    record({ status: 'queued' }),
    record({ status: 'draft' }),
    record({ status: 'archived', published: true }),
    record({ status: 'published', published: true }),
  ]
  assert.equal(countPendingPublish(pending), 2)
})

test('a Published record reads Publishing until the deployed pages catch up', () => {
  const justPublished = record({ status: 'published', published: true, publishedAt: '2026-10-01T10:05:00.000Z' })
  assert.equal(needsRebuild(justPublished, site), true)
  assert.equal(publishState(justPublished, site), 'publishing')

  const settled = record({ status: 'published', published: true, publishedAt: '2026-10-01T09:55:00.000Z' })
  assert.equal(publishState(settled, site), 'published')
})

test('without the site stamp, nothing claims a rebuild is needed', () => {
  const justPublished = record({ status: 'published', published: true, publishedAt: '2026-10-01T10:05:00.000Z' })
  assert.equal(needsRebuild(justPublished, unknownSite), false)
  assert.equal(publishState(justPublished, unknownSite), 'published')
  assert.equal(needsRebuild(record({ publishedAt: 'not a date' }), site), false)
})

test('the hint says whether the website is still showing an older version', () => {
  assert.match(publishStateHint(record({ status: 'draft', published: true }), site), /keeps showing the last published version/)
  assert.match(publishStateHint(record({ status: 'draft', published: false }), site), /Not on the website/)
  assert.match(publishStateHint(record({ status: 'archived', published: true }), site), /Still on the website until the next publish/)
  assert.match(publishStateHint(record({ status: 'queued', published: true }), site), /Replaces the version on the website/)
})

test('the save menu offers Queue first, then Draft and Archive — and never Published', () => {
  assert.deepEqual(
    SAVE_CHOICES.map((choice) => choice.status),
    ['queued', 'draft', 'archived'],
  )
  assert.equal(SAVE_CHOICES[0].label, 'Queue for publish')
})

test('with edits, every save choice is available', () => {
  for (const status of ['draft', 'queued', 'published', 'archived']) {
    for (const choice of SAVE_CHOICES) assert.equal(canSaveAs(choice.status, record({ status }), true), true)
  }
})

test('without edits, re-saving the current status (or re-queueing a Published record) does nothing, so it is unavailable', () => {
  assert.equal(canSaveAs('queued', record({ status: 'queued' }), false), false)
  assert.equal(canSaveAs('queued', record({ status: 'published' }), false), false)
  assert.equal(canSaveAs('draft', record({ status: 'draft' }), false), false)
  assert.equal(canSaveAs('archived', record({ status: 'archived' }), false), false)

  // Status moves alone are still real changes.
  assert.equal(canSaveAs('queued', record({ status: 'draft' }), false), true)
  assert.equal(canSaveAs('queued', record({ status: 'archived' }), false), true)
  assert.equal(canSaveAs('archived', record({ status: 'published' }), false), true)
})

/* Featured is a toggle, not a status: it gets its own column and never rides
   along in the Status cell. */

test('the Status cell renders the status alone — no Featured tag folded in', async () => {
  const { readFileSync } = await import('node:fs')
  const table = readFileSync(new URL('../../apps/admin/src/components/workspace/RecordTable.tsx', import.meta.url), 'utf8')
  const start = table.indexOf("case 'publish': {")
  const end = table.indexOf('case ', start + 10)
  assert.ok(start >= 0 && end > start)
  assert.doesNotMatch(table.slice(start, end), /featured/i)
})

test('every collection with a featured toggle lists it as its own column, and only those', async () => {
  const { collectionRegistry } = await import('../../apps/admin/src/cms/registry.ts')
  for (const collection of collectionRegistry) {
    const hasToggle = collection.fields.some((field) => field.key === 'featured')
    const column = collection.listColumns.find((col) => col.key === 'featured')
    assert.equal(Boolean(column), hasToggle, `${collection.id}: Featured column should exist iff the record has the toggle`)
    if (column) assert.equal(column.valueType, 'boolean')
  }
})
