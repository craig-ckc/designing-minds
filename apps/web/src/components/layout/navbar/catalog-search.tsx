import { cn } from '@designing-minds/utils'
import { Icon } from '../../ui/icon'

/** Header search. A plain GET form to /shop?q=… so it works without JS. */
export function CatalogSearch({ className, onSubmit }: { className?: string; onSubmit?: () => void }) {
  return (
    <form
      action="/shop"
      method="get"
      role="search"
      aria-label="Search the shop"
      onSubmit={onSubmit}
      className={cn(
        'items-center gap-1 rounded-control border border-line-strong bg-surface pl-3 focus-within:outline-2 focus-within:outline-primary-ink',
        className,
      )}
    >
      <input
        type="search"
        name="q"
        aria-label="Search resources"
        placeholder="Search resources…"
        className="min-h-10 w-full min-w-0 bg-transparent text-body outline-none"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="grid h-10 w-10 flex-none place-items-center rounded-control text-ink-soft hover:bg-surface-sunk"
      >
        <Icon name="search" size={16} />
      </button>
    </form>
  )
}
