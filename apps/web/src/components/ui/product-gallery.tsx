import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductImage } from '@designing-minds/cms'
import { Button } from './button'
import { Icon } from './icon'
import { ProductCover, type CoverItem } from './product-cover'

/**
 * The media slot on a Product Detail: the generated cover, then whatever preview
 * images an editor uploaded.
 *
 * Slide 0 is ALWAYS the cover. It isn't an uploaded image and has no URL — it's
 * drawn from the record's own grade/term/subjects (see ProductCover), so every
 * product has one whether or not anyone has uploaded anything. That is why this
 * component composes the cover rather than receiving it as a picture.
 *
 * WITH NO UPLOADS THERE IS NOTHING TO PAGE THROUGH, so the arrows and the
 * thumbnail strip are absent — not disabled. A control that can't do anything is
 * still a promise that something exists behind it, and here nothing does. The
 * no-images branch renders a centred cover in the same media frame.
 *
 * Paging is a scroll-snap track rather than an index-and-transform carousel:
 *  - it works before any JavaScript runs, which matters because this site
 *    prerenders to static HTML (see apps/web/scripts/prerender.mjs) — the cover
 *    is simply the first thing in an overflow container
 *  - swipe, trackpad and momentum come from the platform, correct on every
 *    device, instead of being re-implemented with pointer events
 * The buttons only ask the browser to scroll to a slide, so the two input paths
 * can never disagree about which slide is showing.
 */
export function ProductGallery({
  item,
  images,
  stacked = false,
  className = '',
}: {
  item: CoverItem
  images: ProductImage[]
  /** Bundles fan a deck of covers instead of one. */
  stacked?: boolean
  className?: string
}) {
  if (images.length === 0) {
    return (
      <div className={`product-gallery-stage flex items-center justify-center overflow-hidden rounded-md bg-surface-alt p-6 sm:p-8 ${className}`}>
        <div className="product-gallery-cover">
          <ProductCover product={item} stacked={stacked} priority />
        </div>
      </div>
    )
  }
  return <GalleryTrack key={item.title} item={item} images={images} stacked={stacked} className={className} />
}

function GalleryTrack({
  item,
  images,
  stacked,
  className,
}: {
  item: CoverItem
  images: ProductImage[]
  stacked: boolean
  className: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Starts at 0 so the prerendered markup describes the cover, which is what the
  // static HTML actually shows. The scroll listener corrects it once mounted.
  const [active, setActive] = useState(0)
  const total = images.length + 1

  /* Which slide is showing is derived from the scroll position rather than
     tracked alongside it: a swipe never goes through the buttons, so a separate
     index would drift the moment anyone touched the track. */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const measure = () => {
      frame = 0
      const slides = [...track.children] as HTMLElement[]
      if (slides.length === 0) return
      // Nearest slide to the track's centre — the same thing snap-center lands
      // on, so the indicator agrees with what the eye sees mid-flick.
      const centre = track.scrollLeft + track.clientWidth / 2
      let closest = 0
      let best = Infinity
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centre)
        if (distance < best) {
          best = distance
          closest = index
        }
      })
      setActive(closest)
    }
    const onScroll = () => {
      // Coalesced to one read per frame: a scroll fires far more often than the
      // indicator can usefully change, and each pass touches layout.
      if (frame === 0) frame = window.requestAnimationFrame(measure)
    }
    measure()
    track.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(onScroll)
    observer.observe(track)
    return () => {
      track.removeEventListener('scroll', onScroll)
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [total])

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.children[index] as HTMLElement | undefined
    if (!slide) return
    // scrollTo on the container, not slide.scrollIntoView(): the latter also
    // scrolls the PAGE to bring the track into view, which yanks the layout
    // when someone pages through the gallery from further down the page.
    track.scrollTo({ left: slide.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [])

  const atStart = active === 0
  const atEnd = active === total - 1

  return (
    <div
      className={className}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${item.title} — ${total} images`}
    >
      <div
        ref={trackRef}
        tabIndex={0}
        aria-label="Product images. Use the left and right arrow keys to browse."
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' && !atStart) {
            event.preventDefault()
            goTo(active - 1)
          } else if (event.key === 'ArrowRight' && !atEnd) {
            event.preventDefault()
            goTo(active + 1)
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            goTo(event.key === 'Home' ? 0 : total - 1)
          }
        }}
        className="product-gallery-stage relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-md bg-surface-alt [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-primary-ink focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex h-full w-full flex-none snap-center items-center justify-center p-6 sm:p-8">
          <div className="product-gallery-cover">
            <ProductCover product={item} stacked={stacked} priority />
          </div>
        </div>

        {images.map((image, index) => (
          <div key={image.id} className="relative flex h-full w-full flex-none snap-center items-center justify-center p-6 sm:p-8">
            <img
              src={image.url}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
            <span className="sr-only">{`Image ${index + 2} of ${total}`}</span>
          </div>
        ))}
      </div>

      {/* Controls sit below the media rather than overlapping the artwork. */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">Image {active + 1} of {total}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="solid-light"
            size="icon"
            shape="circle"
            aria-label="Previous image"
            disabled={atStart}
            onClick={() => goTo(active - 1)}
          >
            <Icon name="arrow" size={16} className="rotate-180" />
          </Button>
          <Button
            type="button"
            variant="solid-light"
            size="icon"
            shape="circle"
            aria-label="Next image"
            disabled={atEnd}
            onClick={() => goTo(active + 1)}
          >
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Image thumbnails">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index === 0 ? 'cover' : images[index - 1].id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={index === 0 ? 'Show the cover' : `Show image ${index + 1}`}
            aria-current={index === active}
            className={`flex h-20 w-16 flex-none items-center justify-center overflow-hidden rounded-[6px] border-2 bg-surface-alt p-1 focus-visible:outline-2 focus-visible:outline-primary-ink focus-visible:outline-offset-2 ${index === active ? 'border-primary-ink' : 'border-transparent hover:border-line-strong'}`}
          >
            {index === 0 ? (
              <span className="block w-full" aria-hidden="true">
                <ProductCover product={item} stacked={stacked} />
              </span>
            ) : (
              <img src={images[index - 1].url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
