import { type ComponentPropsWithRef } from 'react'
import { Link } from 'react-router-dom'
import { cn, cv } from '@designing-minds/utils'
import { type VariantOf } from './variants'

/** The inline, underlined link used inside sentences and form footers.
 *  (Standalone calls to action are a `Button`; its text variants carry no
 *  underline.) Inline links are exempt from the 24px target rule. */
const textLinkStyles = cv({
  base: ['underline underline-offset-4'],
  variants: {
    tone: {
      brand: ['font-semibold text-primary-ink hover:text-primary-ink-strong'],
      ink: ['text-ink hover:text-ink-soft'],
      soft: ['text-ink-soft hover:text-ink'],
    },
  },
  defaultVariants: { tone: 'ink' },
})

export type TextLinkTone = VariantOf<typeof textLinkStyles, 'tone'>

type RouterRest = Omit<ComponentPropsWithRef<typeof Link>, 'to' | 'className'>
type AnchorRest = Omit<ComponentPropsWithRef<'a'>, 'href' | 'className'>

export type TextLinkProps =
  | ({ tone?: TextLinkTone; className?: string; to: ComponentPropsWithRef<typeof Link>['to']; href?: undefined } & RouterRest)
  | ({ tone?: TextLinkTone; className?: string; href: string; to?: undefined } & AnchorRest)

/** Router `<Link>` when `to` is passed, plain `<a>` when `href` is passed. */
export function TextLink(props: TextLinkProps) {
  if (props.to !== undefined) {
    const { tone, className, ...rest } = props
    return <Link {...rest} className={cn(textLinkStyles({ tone }), className)} />
  }
  const { tone, className, to: _to, ...rest } = props
  void _to
  return <a {...rest} className={cn(textLinkStyles({ tone }), className)} />
}
