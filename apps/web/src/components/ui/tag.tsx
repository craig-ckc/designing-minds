import { type ReactNode } from 'react'
import { Pill } from './pill'

/** Bordered, dotted feature tag (e.g. the About-page attribute chips).
 *  Thin wrapper over Pill. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <Pill tone="surface" size="md" dot>
      {children}
    </Pill>
  )
}
