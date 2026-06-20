/* The signature Relume placeholder image block. */
export function Placeholder({
  ratio,
  label,
  circle,
  className = '',
}: {
  ratio?: string
  label?: string
  circle?: boolean
  className?: string
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-ph text-ph-glyph ${
        circle ? 'rounded-full' : 'rounded-[10px]'
      } ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden="true"
    >
      <svg className="h-11 w-11 opacity-90" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="9" width="36" height="30" rx="3" />
        <circle cx="17" cy="19" r="3.5" />
        <path d="M9 35l10-9 7 6 6-5 7 6" />
      </svg>
      {label ? (
        <span className="absolute bottom-3 left-3 text-[0.72rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      ) : null}
    </div>
  )
}
