import { type ReactNode } from 'react'
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
        <Dialog.Popup className="fixed bottom-3 right-3 top-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-lg border border-line bg-canvas transition-transform duration-300 ease-out data-[ending-style]:translate-x-[110%] data-[starting-style]:translate-x-[110%]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-body-lg font-bold">Filters</Dialog.Title>
            <Dialog.Close
              aria-label="Close filters"
              className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              <span className="h-4 w-4">
                <Icon name="close" />
              </span>
            </Dialog.Close>
          </div>

          <ScrollArea.Root className="min-h-0 flex-1">
            <ScrollArea.Viewport className="h-full">
              <div className="grid gap-5 px-5 py-5">{children}</div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="m-2 flex w-1.5 justify-center rounded-full opacity-0 transition-opacity delay-150 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
            >
              <ScrollArea.Thumb className="w-full rounded-full bg-line-strong" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
            <Button type="button" variant="text" onClick={onReset} className="text-body-lg">
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

/** Compact outlined filter trigger with an optional active-count badge. */
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
    <button type="button" onClick={onClick} className={`filter-control shrink-0 ${className}`}>
      <span className="h-4 w-4">
        <Icon name="filter" />
      </span>
      Filters
      {activeCount > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-ink px-1 text-caption font-bold text-on-primary">
          {activeCount}
        </span>
      ) : null}
    </button>
  )
}

/** A labelled, wrapping row of multi-select filter pills. */
export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  disabled = false,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  /** Greys the whole group out (for filters that do not apply to the current product type). */
  disabled?: boolean
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-ink-soft">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(option)}
              className="filter-chip disabled:cursor-not-allowed disabled:opacity-50"
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type ProductTypeValue = 'all' | 'digital' | 'physical'

const PRODUCT_TYPE_OPTIONS: readonly { value: ProductTypeValue; label: string }[] = [
  { value: 'all', label: 'All products' },
  { value: 'digital', label: 'Digital resources' },
  { value: 'physical', label: 'Gifts & keyrings' },
]

/** Single-choice product type group: the first group in the shop's filter sheet. */
export function ProductTypeGroup({ value, onChange }: { value: ProductTypeValue; onChange: (value: ProductTypeValue) => void }) {
  return (
    <div role="group" aria-labelledby="filter-product-type">
      <h3 id="filter-product-type" className="mb-2 text-xs font-semibold text-ink-soft">Product type</h3>
      <div className="flex flex-wrap gap-2">
        {PRODUCT_TYPE_OPTIONS.map((option) => (
          <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className="filter-chip">
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
