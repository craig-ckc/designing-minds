import { useState } from 'react'
import { cn } from '@designing-minds/utils'
import { Icon } from './icon'

/**
 * Number stepper: minus, editable value, plus in one bordered control. The
 * centre is a real `<input type="number">`; typing is held as a draft and
 * committed (clamped to min/max) on blur or Enter. Non-numeric drafts revert.
 */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
  disabled = false,
  label,
  name,
  id,
  invalid,
  'aria-describedby': describedBy,
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'md' | 'sm'
  disabled?: boolean
  /** Accessible name, e.g. "Quantity for Personalised name keyring". */
  label: string
  name?: string
  id?: string
  invalid?: boolean
  'aria-describedby'?: string
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, n))
  const commit = () => {
    if (draft === null) return
    const n = Number.parseInt(draft, 10)
    setDraft(null)
    if (Number.isFinite(n) && clamp(n) !== value) onChange(clamp(n))
  }
  const step = (delta: number) => {
    setDraft(null)
    onChange(clamp(value + delta))
  }
  const small = size === 'sm'
  const btn = cn(
    'grid h-full shrink-0 place-items-center text-ink transition-colors hover:bg-surface-sunk disabled:opacity-40 disabled:hover:bg-transparent',
    small ? 'w-8' : 'w-10',
  )

  return (
    <div
      className={cn(
        'inline-flex overflow-hidden rounded-md border bg-canvas transition focus-within:border-primary',
        invalid ? 'border-danger' : 'border-line-strong',
        disabled && 'opacity-50',
        small ? 'h-[var(--control-h-sm)]' : 'h-[var(--control-h)]',
        className,
      )}
    >
      <button type="button" aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => step(-1)} className={btn}>
        <Icon name="minus" size={16} />
      </button>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        min={min}
        max={max}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
        className={cn(
          'min-w-0 bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          small ? 'w-9 text-label' : 'w-12 text-body',
        )}
      />
      <button type="button" aria-label="Increase quantity" disabled={disabled || (max !== undefined && value >= max)} onClick={() => step(1)} className={btn}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
