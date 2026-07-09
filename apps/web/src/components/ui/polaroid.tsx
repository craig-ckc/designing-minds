import { cn } from '@designing-minds/utils'

/** A tilted "photo print" — white frame around the shared placeholder image
 *  (or a real `src`), with an optional handwritten-style caption. Uses the
 *  sanctioned `shadow-cover` so it reads as a physical object lifting off the
 *  page (same treatment as product covers). Rotation is passed as a CSS angle
 *  so callers can scatter a cluster. */
export function Polaroid({
  src,
  alt = '',
  caption,
  ratio = '4 / 5',
  rotate = '-2deg',
  className,
}: {
  src?: string
  alt?: string
  caption?: string
  ratio?: string
  rotate?: string
  className?: string
}) {
  return (
    <figure
      className={cn('rounded-[10px] border border-line/70 bg-surface p-2.5 shadow-cover', className)}
      style={{ transform: `rotate(${rotate})` }}
    >
      <div className="overflow-hidden rounded-[4px] bg-surface-sunk" style={{ aspectRatio: ratio }}>
        <img src={src ?? '/placeholder-image.svg'} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
      {caption ? (
        <figcaption className="pt-2.5 pb-0.5 text-center text-caption font-bold uppercase tracking-[0.12em] text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
