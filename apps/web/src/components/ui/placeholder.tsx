/* Clean image stand-in. Renders a real image when `src` is provided, otherwise
   a quiet neutral panel with a subtle image glyph. */
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
      className={`relative grid place-items-center overflow-hidden bg-surface-sunk text-muted ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <svg className="h-8 w-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.6" />
          <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
        </svg>
      )}
      {label && !src ? (
        <span className="absolute bottom-2.5 left-2.5 text-[0.72rem] font-medium text-muted">{label}</span>
      ) : null}
    </div>
  )
}
