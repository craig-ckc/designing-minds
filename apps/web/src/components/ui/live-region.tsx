/* eslint-disable react-refresh/only-export-components -- the hook belongs with its provider */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type Politeness = 'polite' | 'assertive'
export type Announce = (message: string, options?: { politeness?: Politeness }) => void

const noop: Announce = () => {}
const AnnounceContext = createContext<Announce>(noop)

/** How long a message stays in the region before it is cleared. */
const CLEAR_AFTER_MS = 6000

/**
 * App-wide screen-reader announcer. Mounts two visually hidden live regions
 * (polite and assertive) once, so any component can announce a state change —
 * "Grade 4 Mathematics added to cart", "12 results" — without owning a region.
 * Mounted in `Shell`; outside a provider `useAnnounce()` is a harmless no-op.
 *
 * Announcing the same text twice in a row is re-read: the region is emptied for
 * a tick before it is filled again.
 */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const timers = useRef<Record<Politeness, { reveal?: number; clear?: number }>>({ polite: {}, assertive: {} })

  useEffect(() => () => {
    for (const channel of Object.values(timers.current)) {
      if (channel.reveal !== undefined) window.clearTimeout(channel.reveal)
      if (channel.clear !== undefined) window.clearTimeout(channel.clear)
    }
  }, [])

  const announce = useCallback<Announce>((message, options) => {
    const politeness = options?.politeness ?? 'polite'
    const set = politeness === 'assertive' ? setAssertive : setPolite
    const channel = timers.current[politeness]
    if (channel.reveal !== undefined) window.clearTimeout(channel.reveal)
    if (channel.clear !== undefined) window.clearTimeout(channel.clear)
    set('')
    channel.reveal = window.setTimeout(() => {
      channel.reveal = undefined
      set(message)
    }, 50)
    channel.clear = window.setTimeout(() => {
      channel.clear = undefined
      set('')
    }, 50 + CLEAR_AFTER_MS)
  }, [])

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-live-region="polite">{polite}</div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" data-live-region="assertive">{assertive}</div>
    </AnnounceContext.Provider>
  )
}

/** `announce(message, { politeness?: 'polite' | 'assertive' })` — polite by default. */
export function useAnnounce(): Announce {
  return useContext(AnnounceContext)
}
