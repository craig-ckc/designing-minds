import { cv } from '@designing-minds/utils'

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text'
export type ButtonSize = 'sm' | 'md' | 'icon'

/**
 * Branded button styling, on top of the Base UI Button primitive.
 *
 * Exported because a few controls need to *look* like a button while being
 * something else entirely — a `<label>` that opens a file picker, for
 * instance. Those must not go through Base UI's Button: a non-native button
 * gets `role="button"` and its own Space/Enter handling, which both lies about
 * what the element is and fights the label's native activation.
 */
export const buttonStyles = cv({
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
