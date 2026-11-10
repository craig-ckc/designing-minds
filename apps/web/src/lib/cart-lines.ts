import { bundleContents, type Bundle, type CatalogItem, type CmsSnapshot, type Product } from '@designing-minds/cms'

/* -------------------------------------------------------------------------
   Cart-line view model.

   A cart line names either a resource or a bundle. Cart, checkout and cards
   all need the same few derived facts about it; this is the one place that
   unwraps the `kind` union and derives them.
   ------------------------------------------------------------------------- */

/** The record behind a catalogue item, whichever Collection it came from. */
export const catalogRecord = (item: CatalogItem): Product | Bundle => (item.kind === 'product' ? item.product : item.bundle)

/** A bundle carries no subjects of its own: they are those of its published members. */
export const bundleSubjects = (snapshot: CmsSnapshot, bundle: Bundle): string[] => [
  ...new Set(bundleContents(snapshot, bundle).flatMap((entry) => entry.subjects)),
]

export interface CartLineView {
  kind: CatalogItem['kind']
  record: Product | Bundle
  slug: string
  title: string
  href: string
  subjects: string[]
  /** One-line description, e.g. "Grade 4 · Term 3" or "Bundle · Grade 4 · Term 3 · 5 resources". */
  detail: string
}

export function cartLineView(snapshot: CmsSnapshot, item: CatalogItem): CartLineView {
  const record = catalogRecord(item)
  const base = { kind: item.kind, record, slug: record.slug, title: record.title, href: `/shop/${record.slug}` }
  if (item.kind === 'product') {
    return { ...base, subjects: item.product.subjects, detail: `${record.grade} · ${record.term}` }
  }
  const contents = bundleContents(snapshot, item.bundle)
  const count = contents.length > 0 ? ` · ${contents.length} resource${contents.length === 1 ? '' : 's'}` : ''
  return {
    ...base,
    subjects: [...new Set(contents.flatMap((entry) => entry.subjects))],
    detail: `Bundle · ${record.grade} · ${record.term}${count}`,
  }
}
