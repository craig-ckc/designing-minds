import { type ComponentPropsWithRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'
import { type VariantOf } from './variants'

/** One bordered/raised surface with the canonical --radius-md corner (12px).
 *  Renders a router <Link> when `to` is passed, an <a> when `href` is passed,
 *  otherwise the `as` element. Other element props pass through.
 *
 *  Surfaces: `surface` (flat fill), `outline` (fill + hairline border, the
 *  recipe for checkout/cart/summary panels), `interactive` (outline whose
 *  border strengthens on hover). */
const cardStyles = cv({
  base: ['rounded-md'],
  variants: {
    variant: {
      surface: ['bg-surface'],
      surfaceAlt: ['bg-surface-alt'],
      outline: ['border border-line bg-surface'],
      featured: ['border-2 border-primary bg-primary-tint/40'],
      interactive: ['border border-line bg-surface transition-colors hover:border-line-strong'],
      onPrimary: ['bg-primary-strong text-on-primary'],
    },
    pad: {
      none: [],
      sm: ['p-4'],
      md: ['p-6'],
      lg: ['p-8'],
    },
    shadow: {
      none: [],
      soft: ['shadow-soft'],
      card: ['shadow-card'],
    },
  },
  defaultVariants: { variant: 'surface', pad: 'md', shadow: 'none' },
})

export type CardVariant = VariantOf<typeof cardStyles, 'variant'>
export type CardPad = VariantOf<typeof cardStyles, 'pad'>
export type CardShadow = VariantOf<typeof cardStyles, 'shadow'>

interface OwnProps {
  variant?: CardVariant
  pad?: CardPad
  shadow?: CardShadow
  className?: string
  children?: ReactNode
}

export type CardDivProps = OwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof OwnProps> & { as?: 'div' | 'article' | 'figure' | 'section'; to?: undefined; href?: undefined }
export type CardLinkProps = OwnProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof OwnProps | 'to'> & { to: ComponentPropsWithRef<typeof Link>['to']; href?: undefined; as?: undefined }
export type CardAnchorProps = OwnProps &
  Omit<ComponentPropsWithRef<'a'>, keyof OwnProps | 'href'> & { href: string; to?: undefined; as?: undefined }

export type CardProps = CardDivProps | CardLinkProps | CardAnchorProps

function splitOwn<T extends OwnProps>(props: T) {
  const { variant, pad, shadow, className, children, ...rest } = props
  return { cls: cn(cardStyles({ variant, pad, shadow }), className), children, rest }
}

export function Card(props: CardProps) {
  if (props.to !== undefined) {
    const { cls, children, rest } = splitOwn(props)
    return <Link {...rest} className={cls}>{children}</Link>
  }
  if (props.href !== undefined) {
    const { cls, children, rest } = splitOwn(props)
    return <a {...rest} className={cls}>{children}</a>
  }
  const { cls, children, rest } = splitOwn(props)
  const { as: Tag = 'div', ...divRest } = rest
  return <Tag {...divRest} className={cls}>{children}</Tag>
}
