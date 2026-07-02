import { type ReactNode } from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { cn } from '@designing-minds/utils'
import { Button } from './Button'

/** Centered modal shell on the Base UI Dialog primitive (monochrome card). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-ink/30" />
        <BaseDialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-4rem)] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-[10px] border border-line bg-surface p-6 shadow-xl',
            className,
          )}
        >
          <BaseDialog.Title className="text-[1.05rem] font-semibold tracking-[-0.01em]">{title}</BaseDialog.Title>
          {description ? (
            <BaseDialog.Description className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
              {description}
            </BaseDialog.Description>
          ) : null}
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

/** Two-button confirmation dialog: cancel keeps the user where they are. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="solid" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
