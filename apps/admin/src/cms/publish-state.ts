/* -------------------------------------------------------------------------
   Publish state — the one place that decides what a record's status word is.

   Every editable record carries `status`, the editor's intent, and the
   database keeps a separate LIVE copy that the website, cart and checkout
   serve (see supabase/patch/2026-10-01-publish-workflow.sql):

     Draft      being worked on. The site keeps serving the live copy, if any,
                and never picks this version up.
     Queued     ready. The next Publish makes this the live copy.
     Published  the live copy is this content. Only Publish sets it.
     Archived   kept, but off the site. The next Publish removes the live copy.

   Saving always picks one of Draft / Queued / Archived — there is no plain
   "Save". Publishing (the top-bar button) is the only thing that changes
   what's live, so "is it on the site?" never depends on remembering to press
   two buttons in the right order.

   One derived word on top: Publishing — Published in the database (so already
   live in the cart and checkout) but the static pages haven't been rebuilt
   with it yet. That's the window while a build runs, or after a failed one.

   Consumed by RecordTable, RecordEditor and PublishButton so all three agree.
   ------------------------------------------------------------------------- */

import type { ContentStatus } from '@designing-minds/cms'
import type { SiteBuild } from '../lib/site-build'
import type { AdminRecord } from './types'
import { getPath } from './record.ts'

/** The record key every editable collection keeps its status in. */
export const STATUS_KEY = 'status'

export const CONTENT_STATUSES: readonly ContentStatus[] = ['draft', 'queued', 'published', 'archived']

/** The status an editor can save with. Published is reached by publishing, never chosen. */
export type SaveStatus = Exclude<ContentStatus, 'published'>

export type PublishState = ContentStatus | 'publishing'

/** What the admin knows about the deployed website right now. */
export interface SiteStatus {
  /** The live site's own build stamp, or null when it couldn't be read. */
  build: SiteBuild | null
}

export const UNKNOWN_SITE: SiteStatus = { build: null }

/** Parse an ISO timestamp to millis. Blank/invalid values return null, never NaN. */
function time(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

/** The record's stored status. Anything unrecognised reads as Draft — the safe guess. */
export function recordStatus(record: AdminRecord): ContentStatus {
  const value = getPath(record, STATUS_KEY)
  return CONTENT_STATUSES.includes(value as ContentStatus) ? (value as ContentStatus) : 'draft'
}

/** True while the record has a live copy on the site (maintained by publishing). */
export function isLive(record: AdminRecord): boolean {
  return Boolean(getPath(record, 'published'))
}

/** The next Publish would change this record on the site. */
export function needsPublish(record: AdminRecord): boolean {
  const status = recordStatus(record)
  return status === 'queued' || (status === 'archived' && isLive(record))
}

/**
 * The live copy changed after the deployed site read the CMS: the cart and
 * checkout already have it, the static pages don't. Unknown site stamp → false;
 * we only claim a rebuild is needed on evidence.
 */
export function needsRebuild(record: AdminRecord, site: SiteStatus): boolean {
  const changed = time(getPath(record, 'publishedAt'))
  const content = time(site.build?.contentAt)
  if (changed === null || content === null) return false
  return changed > content
}

/** The status word for one record, given what we know about the live site. */
export function publishState(record: AdminRecord, site: SiteStatus): PublishState {
  const status = recordStatus(record)
  if (status === 'published' && needsRebuild(record, site)) return 'publishing'
  return status
}

export type StateTone = 'solid' | 'outline' | 'muted' | 'warn' | 'info' | 'success'

export const PUBLISH_STATE_LABEL: Record<PublishState, string> = {
  draft: 'Draft',
  queued: 'Queued',
  publishing: 'Publishing',
  published: 'Published',
  archived: 'Archived',
}

export const PUBLISH_STATE_TONE: Record<PublishState, StateTone> = {
  draft: 'outline',
  queued: 'warn',
  publishing: 'info',
  published: 'success',
  archived: 'muted',
}

/** Longer explanation, used as the tooltip on the status. Depends on whether a live copy exists. */
export function publishStateHint(record: AdminRecord, site: SiteStatus): string {
  const live = isLive(record)
  switch (publishState(record, site)) {
    case 'draft':
      return live
        ? 'Draft. The website keeps showing the last published version until you queue this one and publish.'
        : 'Draft. Not on the website.'
    case 'queued':
      return live
        ? 'Queued. Replaces the version on the website at the next publish.'
        : 'Queued. Goes on the website at the next publish.'
    case 'publishing':
      return 'Live in the shop; the website pages are still being rebuilt with it.'
    case 'published':
      return 'Published. The website shows exactly this.'
    case 'archived':
      return live ? 'Archived. Still on the website until the next publish removes it.' : 'Archived. Not on the website.'
  }
}

/** How many of these records the next Publish would change. */
export function countPendingPublish(records: AdminRecord[]): number {
  return records.reduce((count, record) => (needsPublish(record) ? count + 1 : count), 0)
}

/* ------------------------------ Save choices --------------------------- */

export interface SaveChoice {
  status: SaveStatus
  label: string
  description: string
}

/** The three ways to save, in menu order. Queue is first: it's the common case. */
export const SAVE_CHOICES: readonly SaveChoice[] = [
  {
    status: 'queued',
    label: 'Queue for publish',
    description: 'Save, and include it in the next publish.',
  },
  {
    status: 'draft',
    label: 'Save as draft',
    description: 'Save, but keep it off the website. Anything already live stays as it is.',
  },
  {
    status: 'archived',
    label: 'Archive',
    description: 'Save, and take it off the website at the next publish. Nothing is deleted.',
  },
]

/**
 * Whether saving with `status` would do anything. With no edits, choosing the
 * status the record already has is a no-op, and queueing an unchanged
 * Published record would publish nothing.
 */
export function canSaveAs(status: SaveStatus, record: AdminRecord, dirty: boolean): boolean {
  if (dirty) return true
  const current = recordStatus(record)
  if (status === 'queued') return current !== 'queued' && current !== 'published'
  return current !== status
}
