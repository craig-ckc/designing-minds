import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'

export type ButtonVariant =
  | 'solid'
  | 'solid-light'
  | 'soft'
  | 'outline'
  | 'outline-light'
  | 'text'
  | 'text-light'
export type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm'
export type ButtonShape = 'default' | 'circle'

/** Button styling via the team `cv` variant builder. */
const buttonStyles = cv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold',
    'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:opacity-50',
  ],
  variants: {
    variant: {
      solid: [
        'border border-primary-edge text-on-primary [background-image:var(--gradient-primary)]',
        'hover:[background-image:var(--gradient-primary-hover)]',
      ],
      'solid-light': ['border border-line bg-surface text-ink hover:bg-surface-sunk'],
      soft: ['bg-surface-sunk text-ink hover:bg-line-strong'],
      outline: ['border-[1.5px] border-line-strong text-ink hover:border-primary hover:bg-surface-alt'],
      'outline-light': ['border-[1.5px] border-on-primary/55 text-on-primary hover:bg-on-primary/10'],
      text: ['font-semibold text-primary hover:opacity-70'],
      'text-light': ['font-semibold text-on-primary hover:opacity-70'],
    },
    size: {
      md: ['min-h-[var(--control-h)] px-5 text-body-sm'],
      sm: ['min-h-[var(--control-h-sm)] px-3.5 text-label'],
      icon: ['h-10 w-10 shrink-0'],
      'icon-sm': ['h-9 w-9 shrink-0'],
    },
    shape: {
      default: [],
      circle: ['rounded-pill'],
    },
  },
  defaultVariants: { variant: 'text', size: 'md', shape: 'default' },
})

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  className?: string
  children: ReactNode
  onClick?: () => void
  'aria-label'?: string
}

interface LinkButtonProps extends BaseProps {
  to: string
}
interface AnchorButtonProps extends BaseProps {
  href: string
  target?: string
  rel?: string
}
interface NativeButtonProps extends BaseProps {
  type?: 'button' | 'submit'
  disabled?: boolean
  'aria-expanded'?: boolean
}

export type ButtonProps = LinkButtonProps | AnchorButtonProps | NativeButtonProps

/**
 * Polymorphic Button. Renders a router `<Link>` when `to` is passed, an `<a>`
 * when `href` is passed, otherwise a native `<button>`. Text variants drop the
 * size padding so inline links sit flush. `size="icon"` + `shape="circle"`
 * gives the round icon-only control — pass `aria-label` for those.
 */
export function Button(props: ButtonProps) {
  const { variant = 'text', size = 'md', shape = 'default', className, children, onClick } = props
  const isText = variant === 'text' || variant === 'text-light'
  const cls = cn(buttonStyles({ variant, size: isText ? undefined : size, shape }), className)
  const ariaLabel = props['aria-label']

  if ('to' in props) {
    return (
      <Link to={props.to} onClick={onClick} aria-label={ariaLabel} className={cls}>
        {children}
      </Link>
    )
  }
  if ('href' in props) {
    return (
      <a href={props.href} target={props.target} rel={props.rel} onClick={onClick} aria-label={ariaLabel} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button
      type={props.type ?? 'button'}
      onClick={onClick}
      disabled={props.disabled}
      aria-expanded={props['aria-expanded']}
      aria-label={ariaLabel}
      className={cls}
    >
      {children}
    </button>
  )
}
