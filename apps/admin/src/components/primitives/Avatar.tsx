import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn } from '@designing-minds/utils'

/**
 * Small circular identity chip on the Base UI Avatar primitive. There is no
 * uploaded image yet, so it always resolves to the fallback initial — but
 * going through Avatar means adding one later is a prop, not a rewrite.
 */
export function Avatar({
  label,
  src,
  className,
}: {
  /** Full name or email; the first character becomes the fallback. */
  label: string
  src?: string
  className?: string
}) {
  return (
    <BaseAvatar.Root
      className={cn(
        'grid h-7 w-7 flex-none select-none place-items-center overflow-hidden rounded-pill',
        'bg-surface-sunk text-[0.72rem] font-semibold text-ink-soft',
        className,
      )}
    >
      {src ? <BaseAvatar.Image src={src} alt="" className="h-full w-full object-cover" /> : null}
      <BaseAvatar.Fallback>{label.slice(0, 1).toUpperCase()}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
