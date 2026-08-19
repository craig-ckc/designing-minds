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
 * indicator are absent — not disabled. A control that can't do anything is
 * still a promise that something exists behind it, and here nothing does. The
 * no-images branch renders the same centred cover the page showed before this
 * component existed.
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
      <div className={`flex justify-center px-8 py-4 sm:px-12 ${className}`}>
        <ProductCover product={item} stacked={stacked} className="max-w-[22rem]" priority />
      </div>
    )
  }
  return <GalleryTrack item={item} images={images} stacked={stacked} className={className} />
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
    return () => {
      track.removeEventListener('scroll', onScroll)
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
    track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
  }, [])

  const atStart = active === 0
  const atEnd = active === total - 1

  return (
    <div
      className={`px-8 py-4 sm:px-12 ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${item.title} — ${total} images`}
    >
      <div className="relative mx-auto w-full max-w-[22rem]">
        <div
          ref={trackRef}
          tabIndex={0}
          onKeyDown={(event) => {
            // Snap points make the browser's own arrow-key scrolling crawl a few
            // pixels at a time, so the keys are mapped to whole slides — the
            // same move the buttons make.
            if (event.key === 'ArrowLeft' && !atStart) {
              event.preventDefault()
              goTo(active - 1)
            } else if (event.key === 'ArrowRight' && !atEnd) {
              event.preventDefault()
              goTo(active + 1)
            }
          }}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-card [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-full flex-none snap-center">
            <ProductCover product={item} stacked={stacked} className="w-full" priority />
          </div>

          {images.map((image, index) => (
            <div key={image.id} className="w-full flex-none snap-center">
              {/* Every slide is boxed to the cover's A4 proportions rather than
                  the photo's own. Uploads arrive in any shape, and sizing each
                  slide to its content would resize the whole media column as the
                  visitor pages — so the box is fixed and the image is contained
                  within it. width/height are still set so the intrinsic ratio is
                  known before the bytes arrive. */}
              <div className="flex aspect-[595/842] w-full items-center justify-center">
                <img
                  src={image.url}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full rounded-card object-contain"
                />
              </div>
              <span className="sr-only">{`Image ${index + 2} of ${total}`}</span>
            </div>
          ))}
        </div>

        {/* Outside the scroll container, so they don't scroll away with it. */}
        <Button
          type="button"
          variant="solid-light"
          size="icon"
          shape="circle"
          aria-label="Previous image"
          disabled={atStart}
          onClick={() => goTo(active - 1)}
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_2px_10px_-2px_rgba(41,25,10,0.25)]"
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
          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 shadow-[0_2px_10px_-2px_rgba(41,25,10,0.25)]"
        >
          <Icon name="arrow" size={16} />
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={index === 0 ? 'Show the cover' : `Show image ${index + 1}`}
            aria-current={index === active}
            /* A dot reads as 8px but is hit as 24px: the visible mark is the
               affordance, the padding is the target. */
            className="grid h-6 w-6 place-items-center rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span
              className={
                index === active
                  ? 'h-2 w-2 rounded-pill bg-primary transition-colors'
                  : 'h-2 w-2 rounded-pill bg-line-strong transition-colors'
              }
            />
          </button>
        ))}
      </div>
    </div>
  )
}
