import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'

export type ButtonVariant = 'solid' | 'outline' | 'text' | 'text-light'
export type ButtonSize = 'md' | 'sm'

/** Button styling via the team `cv` variant builder. */
const button = cv({
  base: ['inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50'],
  variants: {
    variant: {
      solid: ['rounded-md border-[1.5px] border-ink bg-ink text-white hover:opacity-85'],
      outline: ['rounded-md border-[1.5px] border-ink text-ink hover:bg-surface-alt'],
      text: ['text-ink underline underline-offset-4 hover:opacity-70'],
      'text-light': ['text-white underline underline-offset-4 hover:opacity-70'],
    },
    size: {
      md: ['min-h-[46px] px-[22px] text-[0.97rem]'],
      sm: ['min-h-[38px] px-3.5 text-[0.9rem]'],
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
 * Polymorphic button. Renders a router `<Link>` when `to` is passed, an `<a>`
 * when `href` is passed, otherwise a native `<button>`. Text variants drop the
 * size padding so inline links sit flush.
 */
export function Button(props: ButtonProps) {
  const { variant = 'text', size = 'md', className, children, onClick } = props
  const isText = variant === 'text' || variant === 'text-light'
  const cls = cn(button({ variant, size: isText ? undefined : size }), className)

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
