import { cv } from '@designing-minds/utils'

const linkStyles = cv({
  base: ['font-semibold transition-colors'],
  variants: {
    look: {
      bar: ['px-3 py-2 text-body text-ink-soft hover:text-ink'],
      'bar-active': ['px-3 py-2 text-body text-primary-ink'],
      sheet: ['py-4 text-body-lg text-ink'],
      'sheet-active': ['py-4 text-body-lg text-primary-ink'],
    },
    rule: {
      none: [],
      below: ['border-b border-line'],
    },
  },
  defaultVariants: { look: 'bar', rule: 'none' },
})

/** Class for a navigation text link. `level` picks the desktop bar or the mobile
 *  sheet scale; `rule` draws the sheet row's bottom hairline. */
export function navLinkStyles({ level, active, rule = 'none' }: { level: 'bar' | 'sheet'; active: boolean; rule?: 'none' | 'below' }) {
  return linkStyles({ look: active ? `${level}-active` : level, rule })
}
