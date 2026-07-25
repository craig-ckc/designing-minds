import { Link } from 'react-router-dom'

export function Breadcrumb({ trail, current }: { trail: { to: string; label: string }[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-label text-muted">
      {trail.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-2">
          <Link to={crumb.to} className="inline-flex min-h-6 items-center py-0.5 hover:text-ink">
            {crumb.label}
          </Link>
          {/* The separator used the hairline-border token as a text colour, which
              measured 1.43:1. Hierarchy now comes from the current crumb being
              darker than its ancestors, not from the slash being near-invisible. */}
          <span aria-hidden>/</span>
        </span>
      ))}
      <span aria-current="page" className="font-semibold text-ink">
        {current}
      </span>
    </nav>
  )
}
