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
    <div className="grid gap-3">
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
        <ul className="flex flex-wrap gap-2" aria-label="Product images">
          {images.map((entry, index) => (
            <li key={entry.id ?? entry.url}>
              <button
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === selected ? 'true' : undefined}
                onClick={() => setSelected(index)}
                className={cn(
                  'block h-16 w-16 overflow-hidden rounded-md bg-surface-alt ring-offset-2 transition',
                  index === selected ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100',
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
