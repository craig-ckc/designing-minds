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
export type ButtonSize = 'md' | 'sm'

/** Button styling via the team `cv` variant builder. */
const buttonStyles = cv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
    'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:opacity-50',
  ],
  variants: {
    variant: {
      solid: ['bg-primary text-white shadow-soft hover:bg-primary-strong'],
      'solid-light': ['bg-white text-ink shadow-soft hover:bg-white/90'],
      soft: ['bg-surface-sunk text-ink hover:bg-line-strong'],
      outline: ['border-[1.5px] border-line-strong text-ink hover:border-primary hover:bg-surface-alt'],
      'outline-light': ['border-[1.5px] border-white/55 text-white hover:bg-white/10'],
      text: ['font-semibold text-primary hover:opacity-70'],
      'text-light': ['font-semibold text-white hover:opacity-70'],
    },
    size: {
      md: ['min-h-[44px] px-5 text-[0.92rem]'],
      sm: ['min-h-[36px] px-3.5 text-[0.85rem]'],
    },
  },
  defaultVariants: { variant: 'text', size: 'md' },
})

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  onClick?: () => void
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
 * size padding so inline links sit flush.
 */
export function Button(props: ButtonProps) {
  const { variant = 'text', size = 'md', className, children, onClick } = props
  const isText = variant === 'text' || variant === 'text-light'
  const cls = cn(buttonStyles({ variant, size: isText ? undefined : size }), className)

  if ('to' in props) {
    return (
      <Link to={props.to} onClick={onClick} className={cls}>
        {children}
      </Link>
    )
  }
  if ('href' in props) {
    return (
      <a href={props.href} target={props.target} rel={props.rel} onClick={onClick} className={cls}>
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
      className={cls}
    >
      {children}
    </button>
  )
}
