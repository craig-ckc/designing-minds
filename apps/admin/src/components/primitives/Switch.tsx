import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { cn } from '@designing-minds/utils'

/** Monochrome toggle switch on the Base UI Switch primitive (Webflow-style On/Off). */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
}) {
  return (
    <BaseSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative h-5 w-9 flex-none rounded-full border border-line-strong bg-surface-alt p-0.5 transition-colors',
        'data-[checked]:border-ink data-[checked]:bg-ink',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <BaseSwitch.Thumb className="block h-3.5 w-3.5 rounded-full bg-ink-soft transition-transform data-[checked]:translate-x-4 data-[checked]:bg-white" />
    </BaseSwitch.Root>
  )
}
