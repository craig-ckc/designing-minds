import { renderToStaticMarkup } from 'react-dom/server'
import { bundleContents, type CmsSnapshot } from '@designing-minds/cms'
import { ProductCover, type CoverItem } from '../components/ui/product-cover'
import { coverAssetKey } from '../lib/cover-assets'

const fallback: CoverItem = { title: 'Practice resources', grade: '', term: 'Any Term', subjects: ['Mathematics'] }

export function renderCoverJobs(snapshot: CmsSnapshot) {
  const render = (product: CoverItem, stacked: boolean) => ({
    key: coverAssetKey(product.id, stacked),
    stacked,
    html: renderToStaticMarkup(<ProductCover product={product} stacked={stacked} />),
  })

  return [
    render(fallback, false),
    render(fallback, true),
    ...snapshot.products.filter((product) => product.published).map((product) => render(product, false)),
    ...snapshot.bundles.filter((bundle) => bundle.published).map((bundle) => render({
      ...bundle,
      subjects: [...new Set(bundleContents(snapshot, bundle).flatMap((product) => product.subjects))],
    }, true)),
  ]
}
