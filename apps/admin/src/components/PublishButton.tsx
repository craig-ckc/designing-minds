import { useCallback, useEffect, useRef, useState } from 'react'
import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from './primitives'
import { Icon, Spinner } from './ui'
import { fetchBuildStatus, publishWebsite, type BuildState } from '../lib/publish'
import { useSiteStatus } from '../lib/site-status'
import { collectionRegistry } from '../cms/registry'
import { selectRecords } from '../cms/adapter'
import { countPendingPublish, needsRebuild, type SiteStatus } from '../cms/publish-state'

/* -------------------------------------------------------------------------
   Top-bar Publish: makes every Queued record live, rebuilds the website, and
   reports each step until the new site is actually serving.

     idle      hidden unless something is Queued / Archived-but-live, or a
               previous publish left the pages behind the shop
     starting  promoting content + asking Vercel for a build
     watching  polling the build: Queued → Building → Going live
     live      the deployed site's own stamp has moved past the request
     failed    the build errored or never confirmed — offer a retry

   "Live" is decided on evidence: Vercel saying READY and the site's
   build-info.json reading a newer content stamp. Without a Vercel token on the
   server the build state is 'unconfigured' and only the stamp is watched, so
   the button can still say "live" — just not "building" or "failed".
   ------------------------------------------------------------------------- */

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'watching'; requestedAt: string; build: BuildState; inspectorUrl?: string | null; readySince?: number }
  | { kind: 'live' }
  | { kind: 'failed'; message: string; inspectorUrl?: string | null }

const POLL_MS = 4_000
/** A build that hasn't finished in this long is reported as unconfirmed. */
const MAX_WAIT_MS = 20 * 60_000
/** After Vercel says READY, how long to wait for the site's stamp before trusting Vercel alone. */
const READY_GRACE_MS = 60_000
/** Consecutive status-read failures before falling back to watching the stamp only. */
const MAX_STATUS_ERRORS = 5
const STORAGE_KEY = 'dm-admin:publish-in-flight'

export function PublishButton({ snapshot, onPublished }: { snapshot: CmsSnapshot | null; onPublished: () => void }) {
  const site = useSiteStatus()
  const [phase, setPhase] = useState<Phase>(() => resumeInFlight())
  const statusErrors = useRef(0)

  const pending = countPending(snapshot)
  const rebuild = anyNeedsRebuild(snapshot, site)

  const finish = useCallback((next: Phase) => {
    forgetInFlight()
    setPhase(next)
  }, [])

  // Watch the build until it lands, fails or times out.
  useEffect(() => {
    if (phase.kind !== 'watching') return
    let cancelled = false
    const requestedAt = Date.parse(phase.requestedAt)

    const timer = window.setTimeout(async () => {
      let build = phase.build
      let inspectorUrl = phase.inspectorUrl
      if (build !== 'unconfigured' && build !== 'ready') {
        try {
          const status = await fetchBuildStatus(phase.requestedAt)
          statusErrors.current = 0
          build = status.state
          inspectorUrl = status.inspectorUrl ?? inspectorUrl
        } catch {
          statusErrors.current += 1
          if (statusErrors.current >= MAX_STATUS_ERRORS) build = 'unconfigured'
        }
      }
      if (cancelled) return

      if (build === 'error' || build === 'canceled') {
        finish({
          kind: 'failed',
          message: build === 'error' ? 'Build failed. The shop is updated; the pages aren’t yet.' : 'Build was cancelled. The shop is updated; the pages aren’t yet.',
          inspectorUrl,
        })
        return
      }

      if (build === 'ready' || build === 'unconfigured') {
        const stamp = await site.refresh()
        if (cancelled) return
        const landed = stamp ? Date.parse(stamp.contentAt) >= requestedAt : false
        const readySince = build === 'ready' ? (phase.readySince ?? Date.now()) : undefined
        if (landed || (readySince && Date.now() - readySince > READY_GRACE_MS)) {
          finish({ kind: 'live' })
          return
        }
        if (Date.now() - requestedAt > MAX_WAIT_MS) {
          finish({ kind: 'failed', message: "Couldn't confirm the website finished rebuilding.", inspectorUrl })
          return
        }
        setPhase({ ...phase, build, inspectorUrl, readySince })
        return
      }

      if (Date.now() - requestedAt > MAX_WAIT_MS) {
        finish({ kind: 'failed', message: "Couldn't confirm the website finished rebuilding.", inspectorUrl })
        return
      }
      setPhase({ ...phase, build, inspectorUrl })
    }, POLL_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [phase, site, finish])

  // "Live" is a moment, not a state: show it, then step back.
  useEffect(() => {
    if (phase.kind !== 'live') return
    const timer = window.setTimeout(() => setPhase({ kind: 'idle' }), 8_000)
    return () => window.clearTimeout(timer)
  }, [phase.kind])

  const publish = async () => {
    setPhase({ kind: 'starting' })
    statusErrors.current = 0
    try {
      const result = await publishWebsite()
      if (result.state === 'debounced') {
        setPhase({ kind: 'failed', message: result.message ?? 'A publish was just started. Try again in a moment.' })
        return
      }
      // Records just moved Queued → Published; reload so every list agrees.
      onPublished()
      rememberInFlight(result.requestedAt)
      setPhase({ kind: 'watching', requestedAt: result.requestedAt, build: 'pending' })
    } catch (error) {
      setPhase({ kind: 'failed', message: error instanceof Error ? error.message : 'Unable to publish the website.' })
    }
  }

  const busy = phase.kind === 'starting' || phase.kind === 'watching'
  if (!busy && phase.kind !== 'live' && phase.kind !== 'failed' && pending === 0 && !rebuild) return null

  const { label, message } = describe(phase, pending)

  return (
    <span className="flex items-center gap-2">
      <span
        role="status"
        aria-live="polite"
        className={`hidden max-w-[360px] truncate text-ui md:inline ${phase.kind === 'failed' ? 'text-danger' : 'text-muted'}`}
        title={message ?? undefined}
      >
        {message}
      </span>
      {/* Outside the truncated message, so it can never be clipped away. */}
      {phase.kind === 'failed' && phase.inspectorUrl ? (
        <a
          href={phase.inspectorUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden flex-none text-ui font-medium text-ink hover:text-primary md:inline"
        >
          View build log
        </a>
      ) : null}

      <Button
        variant="solid"
        size="md"
        onClick={() => void publish()}
        disabled={busy || phase.kind === 'live'}
        aria-busy={busy}
        // Busy is not "unavailable": keep full colour so progress reads as progress.
        className="disabled:opacity-100 disabled:cursor-default"
        title={
          pending > 0
            ? `${pending} change${pending === 1 ? '' : 's'} waiting to go on the website.`
            : rebuild
              ? "Content is live in the shop, but the website pages haven't been rebuilt with it."
              : undefined
        }
      >
        {busy ? <Spinner className="size-3.5 text-on-primary" /> : null}
        {phase.kind === 'live' ? (
          <span className="size-4">
            <Icon name="check" />
          </span>
        ) : null}
        {label}
      </Button>
    </span>
  )
}

function describe(phase: Phase, pending: number): { label: string; message: string | null } {
  switch (phase.kind) {
    case 'starting':
      return { label: 'Publishing…', message: 'Publishing content…' }
    case 'watching':
      switch (phase.build) {
        case 'building':
          return { label: 'Building…', message: 'Rebuilding the website. This usually takes a few minutes.' }
        case 'ready':
          return { label: 'Going live…', message: 'Build finished. Switching the website over…' }
        case 'unconfigured':
          return { label: 'Publishing…', message: 'Rebuilding the website. This updates when it’s live.' }
        default:
          return { label: 'Queued…', message: 'Content is in the shop. Website build queued.' }
      }
    case 'live':
      return { label: 'Live', message: 'Everything is live.' }
    case 'failed':
      return { label: 'Retry publish', message: phase.message }
    default:
      return { label: pending > 0 ? `Publish ${pending} change${pending === 1 ? '' : 's'}` : 'Publish', message: null }
  }
}

/** Records the next publish would change, across every editable collection. */
function countPending(snapshot: CmsSnapshot | null): number {
  if (!snapshot) return 0
  return editableCollections().reduce(
    (total, collection) => total + countPendingPublish(selectRecords(snapshot, collection.id)),
    0,
  )
}

/** Any live copy newer than the deployed pages — a publish whose build never landed. */
function anyNeedsRebuild(snapshot: CmsSnapshot | null, site: SiteStatus): boolean {
  if (!snapshot || !site.build) return false
  return editableCollections().some((collection) =>
    selectRecords(snapshot, collection.id).some((record) => needsRebuild(record, site)),
  )
}

const editableCollections = () => collectionRegistry.filter((collection) => !collection.readOnly)

/* A publish in flight survives a page reload: the build doesn't stop because
   the tab did. Best effort — storage can be unavailable. */

function rememberInFlight(requestedAt: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, requestedAt)
  } catch {
    // Not persisted; the reload just won't resume watching.
  }
}

function forgetInFlight() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clean up.
  }
}

function resumeInFlight(): Phase {
  try {
    const requestedAt = window.sessionStorage.getItem(STORAGE_KEY)
    const at = requestedAt ? Date.parse(requestedAt) : Number.NaN
    if (requestedAt && !Number.isNaN(at) && Date.now() - at < MAX_WAIT_MS) {
      return { kind: 'watching', requestedAt, build: 'pending' }
    }
  } catch {
    // Fall through to idle.
  }
  return { kind: 'idle' }
}
