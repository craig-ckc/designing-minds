import { type ComponentPropsWithoutRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn, cv } from '@designing-minds/utils'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'text'
export type ButtonSize = 'sm' | 'md' | 'icon'

/** Monochrome button styling, on top of the Base UI Button primitive. */
const button = cv({
  base: [
    'inline-flex items-center justify-center gap-1.5 font-medium transition select-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    variant: {
      solid: ['rounded-md bg-ink text-white hover:opacity-85'],
      outline: ['rounded-md border border-line-strong text-ink-soft hover:border-ink hover:text-ink'],
      ghost: ['rounded-md text-ink-soft hover:bg-surface-alt hover:text-ink'],
      text: ['text-ink-soft underline underline-offset-4 hover:text-ink'],
    },
    size: {
      sm: ['h-[34px] px-3 text-[0.85rem]'],
      md: ['h-9 px-4 text-[0.9rem]'],
      icon: ['h-8 w-8'],
    },
  },
})

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
  return <BaseButton className={cn(button({ variant, size: resolvedSize }), className)} {...props} />
}
