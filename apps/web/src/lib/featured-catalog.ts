import { publishedBundles, publishedProducts, type Bundle, type CmsSnapshot, type Product } from '@designing-minds/cms'

export type FeaturedCategory = 'all' | 'resources' | 'bundles'
type CatalogEntry = { kind: 'bundle'; bundle: Bundle } | { kind: 'product'; product: Product }

/** Editorial picks first, then catalogue order. Mix types within each priority
 * tier so an unfeatured item never displaces an available featured pick. */
export function featuredCatalog(snapshot: CmsSnapshot, category: FeaturedCategory = 'all'): CatalogEntry[] {
  const bundles = category === 'resources' ? [] : publishedBundles(snapshot).sort((a, b) => a.sortOrder - b.sortOrder)
  const products = category === 'bundles' ? [] : publishedProducts(snapshot).sort((a, b) => a.sortOrder - b.sortOrder)
  const entries: CatalogEntry[] = []
  for (const featured of [true, false]) {
    const bundlePicks = bundles.filter((item) => item.featured === featured)
    const productPicks = products.filter((item) => item.featured === featured)
    for (let i = 0; i < Math.max(bundlePicks.length, productPicks.length); i += 1) {
      if (bundlePicks[i]) entries.push({ kind: 'bundle', bundle: bundlePicks[i] })
      if (productPicks[i]) entries.push({ kind: 'product', product: productPicks[i] })
    }
  }
  return entries.slice(0, 4)
}
