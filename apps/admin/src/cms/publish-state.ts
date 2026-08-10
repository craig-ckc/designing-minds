/* -------------------------------------------------------------------------
   Publish state — the one place that decides what a record's status word is.

   Three statuses, and only ONE of them is a choice:

     Published    the record is on the deployed site, and what the admin shows
                  is what the site is serving
     Draft        it has been saved since the site was last built, so the admin
                  and the site currently disagree — derived, never set by hand
     Unpublished  deliberately not on the site. If it was live, the next site
                  publish removes it

   `published` (the record's own flag) picks between Published and Unpublished.
   Draft is what you get when a published record has changes the site hasn't
   picked up yet, which is why it can't be chosen: it describes a fact about the
   deployment, not an intention.

   There is deliberately no "hold these changes back" state. Doing that
   honestly would mean storing the currently-live copy of every record so the
   build had something older to publish, and we don't keep one — the site is
   always rebuilt from current CMS data. So a saved change always goes out on
   the next publish, and Draft is simply "not out yet".

   Consumed by RecordTable (Status column), RecordEditor (header) and
   PublishButton (how many changes are waiting), so all three always agree.
   ------------------------------------------------------------------------- */

import type { SiteBuild } from '../lib/site-build'
import type { AdminCollection, AdminRecord } from './types'
import { getPath } from './record'

/** Field every editable collection stamps on save. */
export const UPDATED_AT_KEY = 'updatedAt'

export type PublishState =
  /** On the deployed site, and current with it. */
  | 'published'
  /** Saved since the site was last built — the change is not live yet. */
  | 'draft'
  /** Not on the site; a publish removes it if it was. */
  | 'unpublished'
  /**
   * Published, but the site's build stamp couldn't be read, so we can't tell
   * Published from Draft. Shown as Published with the caveat in its tooltip —
   * never as a fourth status the user has to learn.
   */
  | 'unverified'

/** What the admin knows about the deployed website right now. */
export interface SiteStatus {
  /** The live site's own build stamp, or null when it couldn't be read. */
  build: SiteBuild | null
  /** When a rebuild was last requested from this session (ISO), if still in flight. */
  publishRequestedAt: string | null
}

export const UNKNOWN_SITE: SiteStatus = { build: null, publishRequestedAt: null }

/** Parse an ISO timestamp to millis. Blank/invalid values return null, never NaN. */
function time(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * True when the record has been saved since the deployed build read the CMS —
 * i.e. a publish is needed for the site to match the CMS.
 *
 * Deliberately ignores the status flag: *unpublishing* an item also needs a
 * rebuild before it disappears from the site, and that's the case where being
 * wrong leaves stale content public.
 */
export function needsPublish(record: AdminRecord, site: SiteStatus): boolean {
  const updated = time(getPath(record, UPDATED_AT_KEY))
  const content = time(site.build?.contentAt)
  if (updated === null || content === null) return false
  return updated > content
}

/** The status word for one record, given what we know about the live site. */
export function publishState(collection: AdminCollection, record: AdminRecord, site: SiteStatus): PublishState {
  if (collection.statusField && !getPath(record, collection.statusField)) return 'unpublished'

  const updated = time(getPath(record, UPDATED_AT_KEY))
  const content = time(site.build?.contentAt)
  // No stamp on either side — we can only vouch for the record, not the site.
  if (updated === null || content === null) return 'unverified'
  return updated <= content ? 'published' : 'draft'
}

export type StateTone = 'solid' | 'outline' | 'muted' | 'warn' | 'info'

export const PUBLISH_STATE_LABEL: Record<PublishState, string> = {
  published: 'Published',
  draft: 'Draft',
  unpublished: 'Unpublished',
  unverified: 'Published',
}

export const PUBLISH_STATE_TONE: Record<PublishState, StateTone> = {
  published: 'solid',
  draft: 'warn',
  unpublished: 'muted',
  unverified: 'outline',
}

/** Longer explanation, used as the title/tooltip on the status. */
export const PUBLISH_STATE_HINT: Record<PublishState, string> = {
  published: 'Live on the website.',
  draft: 'Saved, but not on the website yet — publish the site to push it live.',
  unpublished: 'Not on the website. The next site publish removes it if it was live.',
  unverified: "Published in the CMS. The website's build stamp couldn't be read, so freshness is unconfirmed.",
}

/** How many of these records are waiting for a site publish. */
export function countPendingPublish(records: AdminRecord[], site: SiteStatus): number {
  return records.reduce((count, record) => (needsPublish(record, site) ? count + 1 : count), 0)
}
