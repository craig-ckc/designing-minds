import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'

export type CardVariant = 'surface' | 'surfaceAlt' | 'featured' | 'interactive' | 'onPrimary'
export type CardPad = 'none' | 'sm' | 'md' | 'lg'
export type CardShadow = 'none' | 'soft' | 'card'

/** One bordered/raised surface with the canonical --radius-card corner.
 *  Replaces the ~12 hand-rolled card shells. Renders a router <Link> when `to`
 *  is passed, an <a> when `href` is passed, otherwise the `as` element. */
const cardStyles = cv({
  base: ['rounded-card'],
  variants: {
    variant: {
      surface: ['border border-line bg-surface'],
      surfaceAlt: ['border border-line bg-surface-alt'],
      featured: ['border-2 border-primary bg-primary-tint/40'],
      interactive: ['border border-line bg-surface transition-colors hover:border-line-strong'],
      onPrimary: ['bg-primary text-on-primary'],
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

interface CardBaseProps {
  variant?: CardVariant
  pad?: CardPad
  shadow?: CardShadow
  className?: string
  children: ReactNode
  id?: string
}
interface CardDivProps extends CardBaseProps {
  as?: 'div' | 'article' | 'figure'
}
interface CardLinkProps extends CardBaseProps {
  to: string
  onClick?: () => void
}
interface CardAnchorProps extends CardBaseProps {
  href: string
  onClick?: () => void
}

export type CardProps = CardDivProps | CardLinkProps | CardAnchorProps

export function Card(props: CardProps) {
  const { variant, pad, shadow, className, children, id } = props
  const cls = cn(cardStyles({ variant, pad, shadow }), className)

  if ('to' in props) {
    return (
      <Link to={props.to} onClick={props.onClick} id={id} className={cls}>
        {children}
      </Link>
    )
  }
  if ('href' in props) {
    return (
      <a href={props.href} onClick={props.onClick} id={id} className={cls}>
        {children}
      </a>
    )
  }
  const Tag = props.as ?? 'div'
  return (
    <Tag id={id} className={cls}>
      {children}
    </Tag>
  )
}
