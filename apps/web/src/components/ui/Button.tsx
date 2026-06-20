import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant = 'solid' | 'text' | 'text-light'

/** Returns the class string for a button variant. */
function buttonClass(variant: ButtonVariant = 'text', extra = '') {
  const base = 'inline-flex items-center justify-center gap-2 text-[0.97rem] font-medium transition'
  const variants: Record<ButtonVariant, string> = {
    solid:
      'min-h-[46px] rounded-md border-[1.5px] border-ink bg-ink px-[22px] text-white hover:opacity-85 disabled:opacity-50',
    text: 'text-ink underline underline-offset-4 hover:opacity-70',
    'text-light': 'text-white underline underline-offset-4 hover:opacity-70',
  }
  return `${base} ${variants[variant]} ${extra}`.trim()
}

interface BaseProps {
  variant?: ButtonVariant
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
 * when `href` is passed, otherwise a native `<button>`.
 */
export function Button(props: ButtonProps) {
  const { variant = 'text', className = '', children, onClick } = props
  const cls = buttonClass(variant, className)

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
