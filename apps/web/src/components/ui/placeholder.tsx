/* Image stand-in. Uses a `src` when provided, otherwise the single shared
   `/placeholder.png` asset — so all placeholder content reads the same and we
   never invent bespoke placeholders. An optional `label` overlays a caption. */
export function Placeholder({
  ratio,
  label,
  circle,
  src,
  alt = '',
  className = '',
}: {
  ratio?: string
  label?: string
  circle?: boolean
  src?: string
  alt?: string
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden bg-surface-sunk ${circle ? 'rounded-pill' : 'rounded-control'} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden={src ? undefined : true}
    >
      <img src={src ?? '/placeholder-image.svg'} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      {label ? (
        <span className="absolute bottom-2.5 left-2.5 rounded-pill bg-surface/80 px-2 py-0.5 text-caption font-medium text-muted backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  )
}
