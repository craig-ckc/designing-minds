import { type ComponentPropsWithoutRef } from 'react'
import { cn, FIELD } from '../../design'

export type TextareaProps = ComponentPropsWithoutRef<'textarea'>

/**
 * Multiline text control. Base UI has no textarea primitive, so this is a native
 * <textarea> styled to match the Base UI Input (same shared field token).
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(FIELD, 'min-h-[88px] resize-y', className)} {...props} />
}
