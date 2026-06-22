import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class strings, resolving conflicts (last wins). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes)
}
