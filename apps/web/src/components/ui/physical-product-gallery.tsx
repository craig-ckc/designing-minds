import { useState } from 'react'
import type { PhysicalCatalogProduct } from '@designing-minds/cms'
import { cn } from '@designing-minds/utils'
import { ProductMedia } from './product-media'

/**
 * Photo gallery for a physical product (code twin of Figma's
 * PhysicalProductGallery): a main 4:3 frame plus a thumbnail row only when
 * there is more than one image. With no images the neutral empty frame shows.
 */
export function PhysicalProductGallery({ product }: { product: Pick<PhysicalCatalogProduct, 'title' | 'galleryImages'> }) {
  const images = product.galleryImages
  const [selected, setSelected] = useState(0)
  const image = images[Math.min(selected, images.length - 1)]

  return (
    <div className="grid gap-4">
      <ProductMedia
        src={image?.url}
        alt={image?.alt || product.title}
        width={image?.width}
        height={image?.height}
        fit="cover"
        aspect="4/3"
        loading="eager"
        fetchPriority="high"
      >
        {!image ? <div role="img" aria-label={`${product.title} product preview not available`} className="absolute inset-0" /> : null}
      </ProductMedia>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3 sm:flex sm:flex-wrap" aria-label="Product images">
          {images.map((entry, index) => (
            <li key={entry.id ?? entry.url}>
              <button
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === selected ? 'true' : undefined}
                onClick={() => setSelected(index)}
                className={cn(
                  // Phones share the row four-up (96px thumbs wrapped 3 + 1 at 375); from sm they are Figma's 96×72.
                  'block aspect-[4/3] w-full overflow-hidden rounded-sm border-2 bg-surface-alt p-0.5 transition-colors sm:aspect-auto sm:h-18 sm:w-24',
                  index === selected ? 'border-primary-ink' : 'border-transparent hover:border-line-strong',
                )}
              >
                <img src={entry.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
