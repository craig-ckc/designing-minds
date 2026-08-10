import { type ComponentPropsWithoutRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from '@designing-minds/utils'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles'

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * App button. `text` variant drops the size padding so inline actions sit flush.
 * Use the Base UI `render` prop to project the styling onto an `<a>` or `<label>`.
 */
export function Button({ variant = 'outline', size = 'sm', className, ...props }: ButtonProps) {
  const resolvedSize = variant === 'text' ? undefined : size
  return <BaseButton className={cn(buttonStyles({ variant, size: resolvedSize }), className)} {...props} />
}
