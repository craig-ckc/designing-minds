type PlaceholderImage =
  | { src: string; alt: string }
  | { src?: undefined; alt?: never }

type PlaceholderProps = PlaceholderImage & {
  ratio?: string
  label?: string
  circle?: boolean
  /** Drop the built-in radius so a parent's `overflow-hidden` controls the
   *  corners — used for full-bleed images inside a card. */
  flush?: boolean
  className?: string
}

/* Image stand-in. A supplied image must also supply its accessible description.
   Without one, the shared placeholder SVG is rendered as a decorative CSS
   background rather than as an empty-alt image. */
export function Placeholder({
  ratio,
  label,
  circle,
  src,
  alt,
  flush,
  className = '',
}: PlaceholderProps) {
  const radius = flush ? '' : circle ? 'rounded-pill' : 'rounded-control'
  return (
    <div
      className={`relative overflow-hidden bg-surface-sunk ${radius} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/placeholder-image.svg')" }}
        />
      )}
      {label ? (
        <span className="absolute bottom-2.5 left-2.5 rounded-pill bg-surface/80 px-2 py-0.5 text-caption font-medium text-muted backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  )
}
