import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Class merger for the admin design system.
 *
 * The admin used to borrow the public site's `cn` from @designing-minds/utils,
 * which registers apps/web's `--text-*` names. Those names don't exist here and
 * the admin's do, so every admin size token was being treated as a *text
 * colour*: `cn('text-ui', 'text-muted')` silently dropped one of them (last
 * `text-*` in the same group wins). Registering the admin's own theme
 * namespaces is the whole reason this file exists rather than a re-export.
 *
 * Keep these lists in step with the `@theme` block in ../index.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta', 'ui', 'title', 'section', 'page', 'metric'] }],
    },
    theme: {
      // `h-bar`, `h-row`, `min-h-field`, `w-pane` — without this they aren't
      // recognised as sizes, so `h-bar h-10` wouldn't resolve.
      spacing: ['bar', 'row', 'field', 'statusbar', 'pane'],
      radius: ['tight', 'control', 'card', 'panel', 'pill'],
      shadow: ['popup', 'field-inset'],
    },
  },
})

/** Merge Tailwind class strings, resolving conflicts (last wins). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes)
}
