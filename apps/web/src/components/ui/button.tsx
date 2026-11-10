import { type ComponentPropsWithRef, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'
import { Icon } from './icon'
import { type VariantOf } from './variants'

/** Button styling via the team `cv` variant builder. */
const buttonStyles = cv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold',
    'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98]',
    'disabled:opacity-50 aria-disabled:opacity-50 data-[loading]:disabled:opacity-100 data-[loading]:aria-disabled:opacity-100',
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
      // Text variants carry no padding so they sit flush in a sentence, but
      // keep a 24px hit area (WCAG 2.5.8).
      text: ['min-h-6 font-semibold text-primary-ink hover:text-primary-ink-strong'],
      'text-light': ['min-h-6 font-semibold text-on-primary hover:underline hover:underline-offset-4'],
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

export type ButtonVariant = VariantOf<typeof buttonStyles, 'variant'>
export type ButtonSize = VariantOf<typeof buttonStyles, 'size'>
export type ButtonShape = VariantOf<typeof buttonStyles, 'shape'>

interface OwnProps {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  /** Marks the button busy: `aria-busy`, not interactive, inline spinner over the
   *  (still announced) label. Width is preserved so the layout does not jump. */
  loading?: boolean
  className?: string
  children?: ReactNode
}

type LinkRest = Omit<ComponentPropsWithRef<typeof Link>, keyof OwnProps | 'to'>
type AnchorRest = Omit<ComponentPropsWithRef<'a'>, keyof OwnProps | 'href'>
type NativeRest = Omit<ComponentPropsWithRef<'button'>, keyof OwnProps>

/** Router `<Link>` — pass `to`. Any anchor attribute (aria-*, data-*, state, …) passes through. */
export type ButtonLinkProps = OwnProps & LinkRest & { to: ComponentPropsWithRef<typeof Link>['to']; href?: undefined }
/** Plain `<a>` — pass `href`. */
export type ButtonAnchorProps = OwnProps & AnchorRest & { href: string; to?: undefined }
/** Native `<button>` (default `type="button"`). */
export type ButtonNativeProps = OwnProps & NativeRest & { to?: undefined; href?: undefined }

export type ButtonProps = ButtonLinkProps | ButtonAnchorProps | ButtonNativeProps

function splitOwn<T extends OwnProps>(props: T) {
  const { variant = 'text', size = 'md', shape = 'default', loading = false, className, children, ...rest } = props
  const isText = variant === 'text' || variant === 'text-light'
  const cls = cn(
    buttonStyles({ variant, size: isText ? undefined : size, shape }),
    loading && 'relative',
    className,
  )
  const content: ReactNode = loading ? (
    <>
      <span className="inline-flex items-center justify-center gap-2 opacity-0">{children}</span>
      <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <Icon name="spinner" size={18} className="animate-spin motion-reduce:animate-none" />
      </span>
    </>
  ) : children
  return { cls, content, loading, rest }
}

/**
 * Polymorphic Button. Renders a router `<Link>` when `to` is passed, an `<a>`
 * when `href` is passed, otherwise a native `<button>`. All other props
 * (aria-*, data-*, id, name, form, title, handlers, ref) are typed from the
 * underlying element and passed through. Text variants drop the size padding so
 * inline links sit flush. `size="icon"` + `shape="circle"` gives the round
 * icon-only control — pass `aria-label` for those.
 */
export function Button(props: ButtonProps) {
  if (props.to !== undefined) {
    const { cls, content, loading, rest } = splitOwn(props)
    const { onClick, ...linkRest } = rest
    return (
      <Link
        {...linkRest}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (loading) { event.preventDefault(); return }
          onClick?.(event)
        }}
        aria-busy={loading || rest['aria-busy']}
        aria-disabled={loading || rest['aria-disabled']}
        data-loading={loading ? '' : undefined}
        className={cls}
      >
        {content}
      </Link>
    )
  }
  if (props.href !== undefined) {
    const { cls, content, loading, rest } = splitOwn(props)
    const { onClick, ...anchorRest } = rest
    return (
      <a
        {...anchorRest}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (loading) { event.preventDefault(); return }
          onClick?.(event)
        }}
        aria-busy={loading || rest['aria-busy']}
        aria-disabled={loading || rest['aria-disabled']}
        data-loading={loading ? '' : undefined}
        className={cls}
      >
        {content}
      </a>
    )
  }
  const { cls, content, loading, rest } = splitOwn(props)
  const { type = 'button', disabled, ...buttonRest } = rest
  return (
    <button
      {...buttonRest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || rest['aria-busy']}
      data-loading={loading ? '' : undefined}
      className={cls}
    >
      {content}
    </button>
  )
}
