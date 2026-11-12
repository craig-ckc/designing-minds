import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

const ASPECT = { '1/1': 'aspect-square', '4/3': 'aspect-[4/3]', '3/4': 'aspect-[3/4]' } as const

/**
 * Frame for a product visual (code twin of Figma's `ProductImage`). Product
 * visuals are images; covers will be rendered to transparent images at build
 * time. The frame owns the background colour, so transparent covers float on it.
 * Pass `src` for an image, or `children` (e.g. the live `ProductCover`) until
 * build-time cover images exist. With neither, an empty neutral frame renders.
 */
export function ProductMedia({
  src,
  alt,
  width,
  height,
  fit = 'contain',
  aspect = '1/1',
  loading = 'lazy',
  fetchPriority,
  className,
  children,
}: {
  src?: string
  alt: string
  width?: number
  height?: number
  /** `contain` insets the image (transparent covers); `cover` fills (photos). */
  fit?: 'contain' | 'cover'
  aspect?: keyof typeof ASPECT
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-surface-alt', ASPECT[aspect], className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain p-[8%]')}
        />
      ) : (
        children
      )}
    </div>
  )
}
