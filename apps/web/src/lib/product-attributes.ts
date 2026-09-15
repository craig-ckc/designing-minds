import type { Product } from '@designing-minds/cms'

/* Compact, factual "what you get" copy for catalogue cards. Every value is read
   off the record itself — a claim that can't be derived from the data is not
   made, so a card can never promise a PDF or a memo the record doesn't carry. */

/** "1 resource" / "8 subjects". */
export const countLabel = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

/** Whole-rand effective price per included resource, or null when there is
 *  nothing to divide by — callers omit the line rather than showing "R 0". */
export const perResourceZar = (priceZar: number, itemCount: number): number | null =>
  itemCount > 0 && priceZar > 0 ? Math.round(priceZar / itemCount) : null

/**
 * One line beneath a single resource's title: file type (only when every
 * purchased file is a PDF), the catalogue's own format label, and the mark
 * allocation when the record has one. e.g. "PDF · Test / Assessment · 30 marks".
 */
export function productAttributeLine(product: Pick<Product, 'resourceFormat' | 'marks' | 'purchasedFiles'>): string {
  const files = product.purchasedFiles ?? []
  const parts: string[] = []
  if (files.length > 0 && files.every((file) => /\.pdf$/i.test(file.filename))) parts.push('PDF')
  parts.push(product.resourceFormat)
  if (product.marks) parts.push(`${product.marks} marks`)
  return parts.join(' · ')
}
