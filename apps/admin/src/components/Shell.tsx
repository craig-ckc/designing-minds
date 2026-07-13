import { useState, type ReactNode } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { repository } from '../repository'
import { useAdminAuth } from '../lib/auth'
import { useUnsavedChanges } from '../lib/unsaved'
import { CollectionSidebar } from './workspace/CollectionSidebar'
import { Icon } from './ui'
import { Button, ConfirmDialog, Menu, MenuItem, MenuLabel, MenuSeparator } from './primitives'
import { PublishButton } from './PublishButton'

/* ----------------------------- Top app bar ----------------------------- */

function TopBar() {
  const { session, logout } = useAdminAuth()
  const unsaved = useUnsavedChanges()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const email = session?.user.email ?? 'Administrator'
  const initial = email.slice(0, 1).toUpperCase()

  const requestLogout = () => {
    if (unsaved.isDirty()) setConfirmLogout(true)
    else void logout()
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 flex-none items-center gap-3 border-b border-line bg-surface px-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-primary text-[0.72rem] font-bold tracking-[-0.04em] text-on-primary">
          DM
        </span>
        <span className="hidden truncate text-[0.9rem] font-semibold tracking-[-0.01em] sm:block">Designing Minds</span>
        <span className="hidden flex-none text-[0.72rem] font-medium uppercase tracking-[0.1em] text-muted md:block">
          Admin
        </span>
      </div>

      <div className="ml-auto flex flex-none items-center gap-2">
        {!repository.canWrite ? (
          <span className="hidden rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[0.72rem] font-medium uppercase tracking-[0.06em] text-muted sm:inline-flex">
            Read only
          </span>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <a href={import.meta.env.VITE_WEB_URL ?? 'http://localhost:5173'} target="_blank" rel="noreferrer" />
          }
        >
          Preview
          <span className="h-3.5 w-3.5">
            <Icon name="external" />
          </span>
        </Button>

        {repository.canWrite ? <PublishButton /> : null}

        <Menu
          trigger={
            <button
              type="button"
              aria-label="Account"
              className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-sunk text-[0.72rem] font-semibold text-ink-soft transition hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1"
            >
              {initial}
            </button>
          }
        >
          <MenuLabel>
            <span className="block text-[0.72rem] uppercase tracking-[0.08em]">Signed in</span>
            <span className="block truncate text-[0.85rem] text-ink">{email}</span>
          </MenuLabel>
          <MenuLabel className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${repository.canWrite ? 'bg-primary' : 'bg-line-strong'}`} />
            {repository.canWrite ? 'Write access' : 'Read only'}
          </MenuLabel>
          <MenuSeparator />
          <MenuItem onClick={requestLogout}>Log out</MenuItem>
        </Menu>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Discard unsaved changes?"
        description="You have unsaved changes that will be lost if you log out now."
        confirmLabel="Log out"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmLogout(false)
          void logout()
        }}
        onCancel={() => setConfirmLogout(false)}
      />
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
                <div className="pointer-events-auto rounded-control border border-danger bg-danger-tint px-4 py-2.5 text-[0.9rem] text-danger shadow-lg">
                  {error}
                </div>
              ) : (
                <div className="pointer-events-auto rounded-control border border-line bg-surface px-4 py-2.5 text-[0.9rem] text-ink-soft shadow-lg">
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
