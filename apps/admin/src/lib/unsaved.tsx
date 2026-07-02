/* eslint-disable react-refresh/only-export-components */
/* -------------------------------------------------------------------------
   Tracks whether an editor somewhere in the app holds unsaved changes, so
   global actions outside the router (logout in the topbar) can confirm before
   discarding a draft. In-app navigation is guarded separately with useBlocker
   in the editor pane; browser refresh/close with a beforeunload handler.
   ------------------------------------------------------------------------- */

import { createContext, useContext, useState, type ReactNode } from 'react'

type UnsavedTracker = {
  isDirty: () => boolean
  setDirty: (dirty: boolean) => void
}

const UnsavedContext = createContext<UnsavedTracker | null>(null)

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  // A stable tracker object over mutable local state — not React state, since
  // dirtiness never drives rendering here; it is only read inside event handlers.
  const [tracker] = useState<UnsavedTracker>(() => {
    let dirty = false
    return {
      isDirty: () => dirty,
      setDirty: (next) => {
        dirty = next
      },
    }
  })
  return <UnsavedContext.Provider value={tracker}>{children}</UnsavedContext.Provider>
}

export function useUnsavedChanges(): UnsavedTracker {
  const ctx = useContext(UnsavedContext)
  if (!ctx) throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider')
  return ctx
}
