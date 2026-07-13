/* Image stand-in. Uses a `src` when provided, otherwise the single shared
   `/placeholder.png` asset — so all placeholder content reads the same and we
   never invent bespoke placeholders. An optional `label` overlays a caption. */
export function Placeholder({
  ratio,
  label,
  circle,
  src,
  alt = '',
  flush,
  className = '',
}: {
  ratio?: string
  label?: string
  circle?: boolean
  src?: string
  alt?: string
  /** Drop the built-in radius so a parent's `overflow-hidden` controls the
   *  corners — used for full-bleed images inside a card. */
  flush?: boolean
  className?: string
}) {
  const radius = flush ? '' : circle ? 'rounded-pill' : 'rounded-control'
  return (
    <div
      className={`relative overflow-hidden bg-surface-sunk ${radius} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden={src ? undefined : true}
    >
      <img src={src ?? '/placeholder-image.svg'} alt={alt} aria-hidden={alt ? undefined : true} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      {label ? (
        <span className="absolute bottom-2.5 left-2.5 rounded-pill bg-surface/80 px-2 py-0.5 text-caption font-medium text-muted backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  )
}
