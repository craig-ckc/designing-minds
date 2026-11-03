import { Link } from 'react-router-dom'
import { publishedProducts, type CmsSnapshot } from '@designing-minds/cms'
import { ProductCover, type CoverItem } from './product-cover'

/** Shared hero/CTA artwork; published resources are preferred to illustrative fallback covers. */
export function ResourceStack({ snapshot, grade, interactive = false, priority = false, layout = 'fan' }: {
  snapshot?: CmsSnapshot | null; grade?: string; interactive?: boolean; priority?: boolean; layout?: 'fan' | 'shelf'
}) {
  const products = snapshot ? publishedProducts(snapshot).filter((product) => !grade || product.grade === grade) : []
  const examples = ['Mathematics', 'English', 'Natural Science'].map((subject, index) => {
    const matches = products.filter((product) => product.subjects.some((name) => name.startsWith(subject)))
    const product = matches.find((item) => item.term === `Term ${index + 1}`)
      ?? matches[0]
      ?? (products.length ? products[index % products.length] : undefined)
    const cover: CoverItem = product ?? { title: `${subject} Practice`, grade: grade ?? 'Grade 4', term: `Term ${index + 1}`, subjects: [subject] }
    return { product, cover }
  })
  return (
    <div className={layout === 'shelf' ? 'resource-stack resource-stack--shelf' : 'resource-stack'}>
      {examples.map(({ product, cover }, index) => interactive ? (
        <Link
          key={index}
          className="resource-stack__book"
          to={product ? `/shop/${product.slug}` : `/shop?grade=${encodeURIComponent(cover.grade)}`}
          aria-label={product ? `View ${product.title}` : `Browse ${cover.grade} resources`}
        >
          <ProductCover product={cover} priority={priority} />
        </Link>
      ) : (
        <div key={index} className="resource-stack__book">
          <ProductCover product={cover} priority={priority} />
        </div>
      ))}
    </div>
  )
}
