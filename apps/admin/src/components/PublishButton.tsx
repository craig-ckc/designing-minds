import { useState } from 'react'
import { Button } from './primitives'
import { publishWebsite } from '../lib/publish'

type State = 'idle' | 'publishing' | 'queued' | 'debounced' | 'error'

/**
 * Top-bar action that regenerates the public website from the latest CMS data.
 * Distinct from saving a record: a rebuild takes as long as the web Vercel build
 * takes, so this only confirms the deploy was *queued*, not that it is live.
 */
export function PublishButton() {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const publish = async () => {
    setState('publishing')
    setMessage(null)
    try {
      const result = await publishWebsite()
      setState(result.state)
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

  return (
    <span className="flex items-center gap-2">
      {message ? (
        <span
          className={`hidden max-w-[260px] truncate text-[0.78rem] md:inline ${state === 'error' ? 'text-ink' : 'text-muted'}`}
          title={message}
        >
          {message}
        </span>
      ) : null}
      <Button variant="solid" size="sm" onClick={() => void publish()} disabled={state === 'publishing'}>
        {state === 'publishing' ? 'Publishing…' : 'Publish website'}
      </Button>
    </span>
  )
}
