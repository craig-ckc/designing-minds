import { type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { Button } from './button'
import { Icon } from './icon'

/**
 * Floating filter sheet built on Base UI Dialog. Detached from the edges with a
 * card radius, its body scrolls via Base UI ScrollArea. Filter groups are passed
 * as children (see ChipGroup); the sheet supplies header, scroll area and footer.
 */
export function FilterDrawer({
  open,
  onOpenChange,
  onReset,
  resultCount,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReset: () => void
  resultCount?: number
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed bottom-3 right-3 top-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-card border border-line bg-canvas transition-transform duration-300 ease-out data-[ending-style]:translate-x-[110%] data-[starting-style]:translate-x-[110%]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-body-lg font-bold">Filters</Dialog.Title>
            <Dialog.Close
              aria-label="Close filters"
              className="grid h-9 w-9 place-items-center rounded-pill text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              <span className="h-4 w-4">
                <Icon name="close" />
              </span>
            </Dialog.Close>
          </div>

          <ScrollArea.Root className="min-h-0 flex-1">
            <ScrollArea.Viewport className="h-full">
              <div className="grid gap-7 px-5 py-6">{children}</div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="m-1.5 flex w-1.5 justify-center rounded-pill opacity-0 transition-opacity delay-150 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
            >
              <ScrollArea.Thumb className="w-full rounded-pill bg-line-strong" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
            <Button type="button" variant="text" onClick={onReset}>
              Reset all
            </Button>
            <Button type="button" variant="solid" onClick={() => onOpenChange(false)}>
              {typeof resultCount === 'number' ? `Show ${resultCount} results` : 'Show results'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** The bar trigger: "Filters" with an optional active-count badge. No outline. */
export function FilterTrigger({
  onClick,
  activeCount = 0,
  className = '',
}: {
  onClick: () => void
  activeCount?: number
  className?: string
}) {
  return (
    <Button type="button" variant="soft" onClick={onClick} className={`shrink-0 ${className}`}>
      <span className="h-4 w-4">
        <Icon name="filter" />
      </span>
      Filters
      {activeCount > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1 text-caption font-bold text-on-primary">
          {activeCount}
        </span>
      ) : null}
    </Button>
  )
}

/** A labelled, wrapping row of multi-select filter pills. */
export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <h4 className="mb-3 text-label font-semibold uppercase tracking-[0.08em] text-muted">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option)}
              className={`rounded-pill border px-3.5 py-1.5 text-body-sm font-semibold transition-colors ${
                on
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line-strong text-ink-soft hover:border-primary hover:text-primary'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Helper: build a toggler for a string[] state setter. */
export const makeToggle =
  (setter: Dispatch<SetStateAction<string[]>>) =>
  (value: string) =>
    setter((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]))
