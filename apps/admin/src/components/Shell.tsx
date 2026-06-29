import { type ReactNode } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { repository } from '../repository'
import { useAdminAuth } from '../lib/auth'
import { CollectionSidebar } from './workspace/CollectionSidebar'
import { Icon } from './ui'
import { Button } from './primitives'

/* ----------------------------- Top app bar ----------------------------- */

function TopBar() {
  const { logout } = useAdminAuth()
  return (
    <header className="sticky top-0 z-30 flex h-12 flex-none items-center gap-4 border-b border-line bg-surface px-3">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-ink text-[0.72rem] font-semibold tracking-[-0.04em] text-white">
          DM
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2.5 text-[0.85rem]">
        <span className="hidden items-center gap-1.5 text-muted sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${repository.canWrite ? 'bg-ink' : 'bg-line-strong'}`} />
          {repository.canWrite ? 'Write access' : 'Read only'}
        </span>
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={import.meta.env.VITE_WEB_URL ?? 'http://localhost:5173'} target="_blank" rel="noreferrer" />
          }
        >
          Preview
          <span className="h-3.5 w-3.5">
            <Icon name="external" />
          </span>
        </Button>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-sunk text-[0.7rem] font-semibold text-ink-soft">
          DM
        </span>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          Log out
        </Button>
      </div>
    </header>
  )
}

/* --------------------------------- Shell ------------------------------- */

export function Shell({
  children,
  snapshot,
  message,
  error,
}: {
  children: ReactNode
  snapshot: CmsSnapshot | null
  message: string | null
  error: string | null
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[256px] flex-none border-r border-line bg-surface lg:block">
          {snapshot ? <CollectionSidebar snapshot={snapshot} /> : null}
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
          {children}

          {message || error ? (
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-sm">
              {error ? (
                <div className="pointer-events-auto rounded-md border border-ink bg-surface px-4 py-2.5 text-[0.9rem] text-ink shadow-lg">
                  {error}
                </div>
              ) : (
                <div className="pointer-events-auto rounded-md border border-line bg-surface px-4 py-2.5 text-[0.9rem] text-ink-soft shadow-lg">
                  {message}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
