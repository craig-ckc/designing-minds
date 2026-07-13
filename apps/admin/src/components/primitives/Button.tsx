import { type ComponentPropsWithoutRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn, cv } from '@designing-minds/utils'

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text'
export type ButtonSize = 'sm' | 'md' | 'icon'

/** Branded button styling, on top of the Base UI Button primitive. */
const button = cv({
  base: [
    'inline-flex items-center justify-center gap-1.5 font-medium transition select-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    variant: {
      solid: [
        'rounded-control border border-primary-edge text-on-primary [background-image:var(--gradient-primary)]',
        'hover:[background-image:var(--gradient-primary-hover)]',
      ],
      soft: ['rounded-control bg-surface-sunk text-ink hover:bg-line-strong'],
      outline: ['rounded-control border border-line-strong text-ink-soft hover:border-primary hover:text-ink'],
      ghost: ['rounded-control text-ink-soft hover:bg-surface-alt hover:text-ink'],
      // Quiet inline action — colour only, no underline (underlines read as
      // web links, not admin controls). Prefer `soft`/`outline`/`ghost` for
      // anything that should look like a button.
      text: ['text-ink-soft hover:text-ink'],
    },
    size: {
      sm: ['h-8 px-3 text-[0.82rem]'],
      md: ['h-9 px-3.5 text-[0.88rem]'],
      icon: ['h-7 w-7'],
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
