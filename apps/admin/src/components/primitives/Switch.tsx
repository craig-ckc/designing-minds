import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { cn } from '../../design'

/** Brand toggle switch on the Base UI Switch primitive (Webflow-style On/Off). */
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
        // No track height on purpose: it derives from the thumb (12px thumb +
        // 4px padding + 2px border = 18px), which is how the reference builds
        // it too. A fixed `h-4` here is what broke it — the track was 16px, so
        // its content box was 10px and the 12px thumb bulged 2px out the
        // bottom. Set the height and the two can silently disagree again.
        'relative w-7 flex-none rounded-full border border-line-strong bg-surface-alt p-0.5 transition-colors',
        'data-[checked]:border-primary-edge data-[checked]:bg-primary',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {/* Travel = the track's inner width minus the thumb: 28 − 2 (border) − 4
          (padding) = 22, less the 12px thumb = 10px. Keep the two in step. */}
      <BaseSwitch.Thumb className="block size-3 rounded-full bg-ink-soft transition-transform data-[checked]:translate-x-2.5 data-[checked]:bg-white" />
    </BaseSwitch.Root>
  )
}
