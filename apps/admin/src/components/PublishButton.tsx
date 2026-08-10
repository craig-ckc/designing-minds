import { useEffect, useState } from 'react'
import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from './primitives'
import { Icon } from './ui'
import { publishWebsite } from '../lib/publish'
import { useSiteStatus } from '../lib/site-status'
import { collectionRegistry } from '../cms/registry'
import { selectRecords } from '../cms/adapter'
import { countPendingPublish } from '../cms/publish-state'

type State = 'idle' | 'publishing' | 'queued' | 'debounced' | 'error'

/**
 * Top-bar action that regenerates the public website from the latest CMS data.
 *
 * Distinct from saving a record: a save lands in the CMS immediately, but the
 * public site is static and only picks changes up on the next build. The button
 * now says how many saved records are waiting for that build, and goes quiet
 * once the deployed site has caught up — so "do I need to publish?" is
 * answered without the user having to remember what they changed.
 */
export function PublishButton({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const site = useSiteStatus()

  const pending = countPending(snapshot, site)
  const waiting = Boolean(site.publishRequestedAt)

  // The result message is transient; it must not outlive the action it
  // describes (the old one stayed on screen for the rest of the session).
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 8000)
    return () => window.clearTimeout(timer)
  }, [message])

  const publish = async () => {
    setState('publishing')
    setMessage(null)
    try {
      const result = await publishWebsite()
      setState(result.state)
      if (result.state === 'queued') {
        // Start watching the live site's build stamp so the records flip from
        // "Queued to publish" to "Published" on evidence, not on a timer.
        site.markPublishRequested()
      }
      setMessage(
        result.state === 'debounced'
          ? result.message ?? 'A rebuild was just requested — try again shortly.'
          : 'Website rebuild queued. Changes go live when the build finishes.',
      )
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Unable to publish the website.')
    }
  }

  const label = () => {
    if (state === 'publishing') return 'Publishing…'
    if (waiting) return 'Publishing…'
    if (pending > 0) return `Publish ${pending} change${pending === 1 ? '' : 's'}`
    return 'Publish'
  }

  const title = () => {
    if (waiting) return 'A website rebuild is running.'
    if (!site.build) return "The website's build stamp couldn't be read, so pending changes are unknown."
    if (pending > 0) return `${pending} saved record${pending === 1 ? '' : 's'} not on the website yet.`
    return 'The website is up to date with the CMS.'
  }

  return (
    <span className="flex items-center gap-2">
      {message ? (
        <span
          className={`hidden max-w-[260px] truncate text-[0.78rem] md:inline ${state === 'error' ? 'text-danger' : 'text-muted'}`}
          title={message}
        >
          {message}
        </span>
      ) : null}

      {/* Nothing pending and nothing running: publishing is a no-op, so the
          button steps down to a quiet control rather than inviting a wasted
          build. It stays enabled — the stamp can only ever be a best guess. */}
      <Button
        variant={pending > 0 && !waiting ? 'solid' : 'outline'}
        size="sm"
        onClick={() => void publish()}
        disabled={state === 'publishing' || waiting}
        title={title()}
      >
        {pending > 0 && !waiting ? (
          <span className="h-3.5 w-3.5">
            <Icon name="spark" />
          </span>
        ) : null}
        {label()}
      </Button>
    </span>
  )
}

/** Saved-but-not-live records across every editable collection. */
function countPending(snapshot: CmsSnapshot | null, site: ReturnType<typeof useSiteStatus>): number {
  if (!snapshot || !site.build) return 0
  return collectionRegistry
    .filter((collection) => !collection.readOnly)
    .reduce((total, collection) => total + countPendingPublish(selectRecords(snapshot, collection.id), site), 0)
}
