import { cn } from '@designing-minds/utils'

type PolaroidImage =
  | { src: string; alt: string }
  | { src?: undefined; alt?: never }

type PolaroidProps = PolaroidImage & {
  caption?: string
  ratio?: string
  rotate?: string
  className?: string
}

/** A tilted "photo print" — white frame around the shared placeholder image
 *  (or a real `src`), with an optional sentence-case caption. Uses the
 *  sanctioned `shadow-cover` so it reads as a physical object lifting off the
 *  page (same treatment as product covers). Rotation is passed as a CSS angle
 *  so callers can scatter a cluster. */
export function Polaroid({
  src,
  alt,
  caption,
  ratio = '4 / 5',
  rotate = '-2deg',
  className,
}: PolaroidProps) {
  return (
    <figure className={cn('rounded-sm border border-line/70 bg-surface p-3 shadow-cover', className)} style={{ transform: `rotate(${rotate})` }} >
      <div className="overflow-hidden rounded-sm bg-surface-sunk" style={{ aspectRatio: ratio }}>
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span
            aria-hidden
            className="block h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/placeholder-image.svg')" }}
          />
        )}
      </div>
      {caption ? (
        <figcaption className="pt-3 pb-0.5 text-center text-body-lg text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
