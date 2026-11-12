import { extendTailwindMerge } from 'tailwind-merge'

// Our design system defines custom font-size utilities via `--text-*` theme
// tokens (see apps/web src/index.css): text-display, text-h1 … text-h6,
// text-body-lg, text-body, text-caption, text-label, text-micro.
//
// tailwind-merge doesn't know these are sizes, so out of the box it treats e.g.
// `text-body-sm` as a *text colour* and decides it conflicts with a real colour
// like `text-primary` / `text-on-primary`, silently dropping the colour (last
// `text-*` wins). Registering the tokens in the `font-size` class group tells
// tailwind-merge they're sizes, so a size and a colour no longer collide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-lg', 'body', 'caption', 'label', 'micro'] },
      ],
    },
  },
})

/** Merge Tailwind class strings, resolving conflicts (last wins). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes)
}
