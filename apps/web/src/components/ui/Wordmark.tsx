import { Link } from 'react-router-dom'

/** The Designing Minds smile mark — a rounded square with a smile, per the brand guide. */
export function SmileMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M8 4h24a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-8l-4 4-4-4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"
        fill="currentColor"
      />
      <path
        d="M13 17c1.7 4.2 4.6 6.5 7 6.5s5.3-2.3 7-6.5"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Brand lockup: smile mark + wordmark. */
export function Wordmark({
  onClick,
  sub = true,
  className = '',
}: {
  onClick?: () => void
  sub?: boolean
  className?: string
}) {
  return (
    <Link to="/" onClick={onClick} className={`flex items-center gap-2.5 ${className}`}>
      <SmileMark className="h-9 w-9 flex-none text-primary" />
      <span className="leading-tight">
        <span className="block text-[1.1rem] font-extrabold tracking-[-0.03em] text-ink">Designing Minds</span>
        {sub ? (
          <span className="block text-[0.68rem] font-semibold tracking-[0.02em] text-muted">
            CAPS-aligned resources
          </span>
        ) : null}
      </span>
    </Link>
  )
}
